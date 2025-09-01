import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Notebook } from '../../entities/notebook.entity';
import { NotebooksController } from '../../notebooks.controller';
import { NotebooksService } from '../../notebooks.service';
import { Repository } from 'typeorm';

describe('NotebookController (Integración)', () => {
  let controller: NotebooksController;
  let service: NotebooksService;
  let repo: Repository<Notebook>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Notebook],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Notebook]),
      ],
      controllers: [NotebooksController],
      providers: [NotebooksService],
    }).compile();

    controller = module.get<NotebooksController>(NotebooksController);
    service = module.get<NotebooksService>(NotebooksService);
    repo = module.get<Repository<Notebook>>(getRepositoryToken(Notebook));
  });

  afterEach(async () => {
    await repo.clear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('deberia devolver la lista de elementos desde el service', async () => {
      await service.create({ title: 'Notebook 1', content: 'i9' });

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ title: 'Notebook 1', content: 'i9' });
      expect(result[0].id).toBeDefined();
    });
  });

  describe('create', () => {
    it('deberia llamar al service con el DTO correcto', async () => {
      const dto = { title: 'Notebook 1', content: 'i9' };

      const result = await controller.create(dto);

      expect(result).toMatchObject(dto);
      expect(result.id).toBeDefined(); // Verifica que tenga un id autogenerado
    });
  });
});
