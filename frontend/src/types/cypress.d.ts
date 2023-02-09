// Fix these types which clashes with Cypress types. This is needed because we're loading Cypress types in some JS files.
// And we need to load JS files to make intellisense and code navigation works in VSCode for those JS files.
declare const expect: jest.Expect;
declare const beforeAll: jest.Lifecycle;
declare const beforeEach: jest.Lifecycle;
declare const afterAll: jest.Lifecycle;
declare const afterEach: jest.Lifecycle;
declare const describe: jest.Describe;
declare const fdescribe: jest.Describe;
declare const xdescribe: jest.Describe;
declare const it: jest.It;
declare const fit: jest.It;
declare const xit: jest.It;
declare const test: jest.It;
declare const xtest: jest.It;
