import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getApiInfo', () => {
    it('should return API name and running status', () => {
      const info = appController.getApiInfo();
      expect(info.name).toBe('Family Tree API');
      expect(info.status).toBe('running');
    });

    it('should expose auth endpoints', () => {
      const info = appController.getApiInfo();
      expect(info.endpoints.auth.register).toBe('POST /auth/register');
      expect(info.endpoints.auth.login).toBe('POST /auth/login');
      expect(info.endpoints.auth.profile).toBe('GET /auth/profile');
    });

    it('should expose trees/persons/relationships endpoints', () => {
      const info = appController.getApiInfo();
      expect(info.endpoints.trees.graph).toBe('GET /trees/:id/graph');
      expect(info.endpoints.persons.delete).toBe('DELETE /persons/:id');
      expect(info.endpoints.relationships.create).toBe('POST /relationships');
    });
  });
});
