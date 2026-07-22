import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'Family Tree API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        auth: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          profile: 'GET /auth/profile',
        },
        trees: {
          create: 'POST /trees',
          list: 'GET /trees',
          getById: 'GET /trees/:id',
          update: 'PATCH /trees/:id',
          delete: 'DELETE /trees/:id',
          graph: 'GET /trees/:id/graph',
        },
        persons: {
          create: 'POST /persons',
          listByTree: 'GET /persons/tree/:treeId',
          getById: 'GET /persons/:id',
          update: 'PATCH /persons/:id',
          delete: 'DELETE /persons/:id',
        },
        relationships: {
          create: 'POST /relationships',
          delete: 'DELETE /relationships/:id',
        },
      },
    };
  }
}
