import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_id: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_id,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Balance is not enough.');
    }

    const transaction = await transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
