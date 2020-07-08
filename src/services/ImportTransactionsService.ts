import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(csvPath: string): Promise<Transaction[]> {
    const fileStream = fs.createReadStream(csvPath);

    const parseStream = csvParse({
      from_line: 2,
      delimiter: ',',
    });

    const parseCSV = fileStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async transaction => {
      const [title, type, value, category] = transaction.map((data: string) =>
        data.trim(),
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoryRepository = getRepository(Category);

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      category => category.title,
    );

    const categoriesToAdd = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const createdCategories = await categoryRepository.create(
      categoriesToAdd.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(createdCategories);

    const importedCategories = [...createdCategories, ...existentCategories];

    const transactionRepository = getRepository(Transaction);

    const importedTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: importedCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(importedTransactions);

    return importedTransactions;
  }
}

export default ImportTransactionsService;
