import { DBSchema, IDBPDatabase, openDB } from 'idb';

export async function getDb(): Promise<IDBPDatabase<Schema>> {
    const db = await openDB<Schema>('finances', 1, { upgrade });
    return db;
}

function upgrade(db: IDBPDatabase<Schema>, oldVersion: number) {

    switch (oldVersion) {
        case 0:
            const transactions = db.createObjectStore('transactions', {keyPath: 'id', autoIncrement: true});
            transactions.createIndex('date', 'date');
            transactions.createIndex('category', 'category');
    }
}

type Account = [string, string | null | undefined] | [null | undefined, string];

export interface Transaction {
    date: Date;
    account: Account;
    description: string;
    amount: number;
    category?: string;
}

export interface Schema extends DBSchema {

    transactions: {
        key: number;
        value: Transaction;
        indexes: {
            id: Schema['transactions']['key'];
            date: Transaction['date'];
            category: Required<Transaction>['category'];
        }
    }

}