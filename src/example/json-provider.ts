import { configJsonProvider } from '../util/json-provider';

configJsonProvider(['src/util/__tests__/mock/app/config/*'], 'config', 'test', ['json', 'js'])
// tslint:disable-next-line:no-console
.then(data => console.log(data));
