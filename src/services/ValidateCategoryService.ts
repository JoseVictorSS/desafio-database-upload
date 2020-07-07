import { getRepository } from 'typeorm';

import Category from '../models/Category';

interface Request {
  title: string;
}

class ValidateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);
    const findCategory = await categoryRepository.findOne({
      where: { title },
    });

    if (findCategory) {
      return findCategory;
    }

    const category = await categoryRepository.create({
      title,
    });

    return category;
  }
}

export default ValidateCategoryService;
