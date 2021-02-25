import { Button, Spinner } from '@blueprintjs/core';
import parse from 'csv-parse';
import { OpenDialogSyncOptions, remote } from 'electron';
import { createReadStream } from 'fs';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { getDb, Transaction } from '~/lib/db';

const OPEN_DIALOG_OPTIONS: OpenDialogSyncOptions = {
    filters: [
        { name: 'Comma Separated File', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile']
};

export function ImportButton() {

    const [loading, setLoading] = useState(false);
    const handleClick = useHandleClick(setLoading);

    return (
        <Button disabled={loading} onClick={handleClick}>
            {loading
                ? <><Spinner className='inline' size={20} /> Loading</>
                : 'Import ...'}
        </Button>
    );
}

export const useHandleClick = (setLoading: Dispatch<SetStateAction<boolean>>) => useCallback(async () => {

    const {filePaths} = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), OPEN_DIALOG_OPTIONS);
    const file = filePaths?.[0];
    if (!file) {
        return;
    }

    setLoading(true);
    save(file).finally(() => setLoading(false));
}, []);

async function save(file: string) {

    const parser = createReadStream(file).pipe(parse({ columns: true }));
    const db = await getDb();

    for await (const record of parser) {
        const transaction = createTransaction(record);
        await db.put('transactions', transaction);
    }
}

interface TransactionRecord {
    Date: string;
    Origin: string;
    Destination: string;
    Description: string;
    Amount: string;
    Category: string;
}

const createTransaction = ({
    Date: date,
    Origin: origin,
    Destination: destination,
    Description: description,
    Amount,
    Category
}: TransactionRecord): Transaction => ({
    date: new Date(date),
    account: [origin, destination],
    description,
    amount: Math.round(Number(Amount) * 100),
    category: Category === '' ? undefined : Category
});
