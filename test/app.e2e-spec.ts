/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Notebook } from '../src/notebooks/entities/notebook.entity';
import { NotebooksService } from '../src/notebooks/notebooks.service';
import { NotebooksController } from '../src/notebooks/notebooks.controller';
import { Repository } from 'typeorm';
import { CreateNotebookDto } from 'src/notebooks/dto/create-notebook.dto';

describe('AppController (e2e)', () => {
  let appSuccess: INestApplication<App>;
  let appError: INestApplication<App>;
  let service: NotebooksService;
  let repo: Repository<Notebook>;

  beforeAll(async () => {
    // Test 200
    const moduleSuccess: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Notebook],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Notebook]),
      ],
    }).compile();
    appSuccess = moduleSuccess.createNestApplication();
    service = moduleSuccess.get<NotebooksService>(NotebooksService);
    repo = moduleSuccess.get<Repository<Notebook>>(
      getRepositoryToken(Notebook),
    );
    await appSuccess.init();

    const moduleError: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [NotebooksController],
      providers: [
        NotebooksService,
        {
          provide: getRepositoryToken(Notebook),
          useValue: {
            find: jest.fn().mockRejectedValue(new Error()),
          },
        },
      ],
    }).compile();
    appError = moduleError.createNestApplication();
    await appError.init();
  });

  afterEach(async () => {
    await repo.clear();
  });

  describe('findAll (GET)', () => {
    it('deberia devolver la lista de elementos desde el service (200)', async () => {
      await service.create({ title: 'Notebook 1', content: 'i9' });
      await service.create({ title: 'Notebook 2', content: 'i7' });

      const response = await request(appSuccess.getHttpServer()).get(
        '/notebooks',
      );

      const elements: Notebook[] = await repo.find();
      expect(response.body).toEqual(
        elements.map((e: Notebook) => ({
          id: e.id,
          title: e.title,
          content: e.content,
        })),
      );
    });

    it('deberia devolver HttpException (500 Internal Server Error)', async () => {
      return request(appError.getHttpServer())
        .get('/notebooks')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain('Error retrieving notebooks');
        });
    });
  });

  describe('create (POST)', () => {
    it('deberia llamar al service con el DTO correcto (200)', async () => {
      const dto: CreateNotebookDto = { title: 'Notebook 1', content: 'i9' };

      const response = await request(appSuccess.getHttpServer())
        .post('/notebooks')
        .send(dto)
        .expect(201);

      expect(response.body).toMatchObject(dto);
      expect(response.body.id).toBeDefined();
    });

    it('deberia devolver HttpException (400 Bad Request)', async () => {
      const dto = {};
      const response = await request(appError.getHttpServer())
        .post('/notebooks')
        .send(dto)
        .expect(400);

      expect(response.body.message).toContain('Error creating notebook');
    });
  });
});
