import urlGlob, { convertToPattern } from '../src/helpers/urlGlob';
import * as express from 'express';
import { isUserGranted } from '../src/hierarchyProvider';
import { IRolesMap } from './hierarchyProvider';

class HadronSecurity {
  private routes: IRoute[] = [];

  constructor(
    private userProvider: IUserProvider,
    private roleHierarchy: IRolesMap,
  ) {
    this.middleware = this.middleware.bind(this);
  }

  public allow(path: string, roles: IRole[]): HadronSecurity {
    let existingRoute: IRoute;
    for (const route of this.routes) {
      if (route.path === path) {
        existingRoute = route;
        break;
      }
    }

    if (existingRoute) {
      roles.forEach((role) => existingRoute.allowedRoles.push(role));
      existingRoute.allowedRoles = [...new Set(existingRoute.allowedRoles)];
    } else {
      const route: IRoute = {
        path: convertToPattern(path),
        allowedRoles: roles,
      };

      this.routes.push(route);
    }
    return this;
  }

  public checkIfRouteExists(path: string): IRoute {
    const route = this.routes.filter((r) => urlGlob(r.path, path));
    if (route.length === 0) {
      throw new Error(`Path: ${path} is not supported by security.`);
    }
    return route[0];
  }

  public isAllowed(path: string, user: IUser): boolean {
    const route = this.checkIfRouteExists(path);
    return isUserGranted(
      user,
      route.allowedRoles.map((route) => route.name),
      this.roleHierarchy,
    );
  }

  public middleware(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void {
    try {
      this.checkIfRouteExists(req.path);
    } catch (error) {
      console.log(error.message);
      return next();
    }

    try {
      if (
        this.isAllowed(
          req.path,
          this.userProvider.loadUserByUsername(req.body.username),
        )
      ) {
        return next();
      }

      res.status(401).json({
        message: 'Unauthenticated',
      });
    } catch (error) {
      console.log(error.message);
      res.status(401).json({
        message: 'Unauthenticated',
      });
    }
  }
}

export default HadronSecurity;