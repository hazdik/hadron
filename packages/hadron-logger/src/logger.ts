import LoggerNameIsRequiredError from './errors/LoggerNameIsRequiredError';
import LoggerAdapterNotDefinedError from './errors/LoggerAdapterNotDefinedError';
import ConfigNotDefinedError from './errors/ConfigNotDefinedError';
import CouldNotRegisterLoggerInContainerError from './errors/CouldNotRegisterLoggerInContainerError';

import defaultAdapters from './adapters';
import { ILogger, ILoggerConfig, ILoggerFactory } from './types';

const adapters = { ...defaultAdapters };

export const registerAdapter = (
  name: string,
  adapter: ILoggerFactory,
): void => {
  adapters[name] = adapter;
};

const register = (container: any, config: any) => {
  let { logger: loggers } = config;

  if (!loggers) {
    throw new ConfigNotDefinedError();
  }

  loggers = loggers instanceof Array ? loggers : [loggers];

  loggers.forEach((logger: ILoggerConfig) => {
    const { type = 'bunyan', ...loggerConfig } = logger;

    if (!(type in adapters)) {
      throw new LoggerAdapterNotDefinedError(type);
    }

    if (!logger.name) {
      throw new LoggerNameIsRequiredError();
    }

    try {
      const loggerInstance: ILogger = adapters[type](loggerConfig);
      container.register(logger.name, loggerInstance);
    } catch (error) {
      throw new CouldNotRegisterLoggerInContainerError(logger.name);
    }
  });
};

export { register };
export default register;
