import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Notebook } from '../../entities/notebook.entity';
import { NotebooksService } from '../../notebooks.service';
import { Repository } from 'typeorm';

describe('NotebookService (Integración)', () => {
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
      providers: [NotebooksService],
    }).compile();

    service = module.get<NotebooksService>(NotebooksService);
    repo = module.get<Repository<Notebook>>(getRepositoryToken(Notebook));
  });

  afterEach(async () => {
    await repo.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('deberia obtener y retornar la lista de elementos (Notebooks)', async () => {
      await repo.save({ title: 'Notebook 1', content: 'i9' });

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        title: 'Notebook 1',
        content: 'i9',
      });
    });
  });

  describe('create', () => {
    it('deberia crear y guardar un elemento (Notebook)', async () => {
      // Se crea el elemento
      const element = await service.create({
        title: 'Notebook 1',
        content: 'i9',
      });

      // Verifica que tengo un id
      expect(element.id).toBeDefined();
      // Verifica que el elemento tenga determinados datos
      expect(element).toMatchObject({ title: 'Notebook 1', content: 'i9' });

      // Busca el elemento por la id
      const saved = await repo.findOneBy({ id: element.id });
      expect(saved).toBeDefined();
    });
  });
});
