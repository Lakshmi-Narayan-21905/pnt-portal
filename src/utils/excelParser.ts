import * as XLSX from 'xlsx';

export interface ParsedUser {
    username: string; // Will be used as email prefix if not a full email
    password?: string; // Optional, might benefit from auto-gen if missing
    department?: string;
    classId?: string;
    [key: string]: any;
}

export const ExcelParser = {
    parseUserFile: (file: File): Promise<ParsedUser[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet) as ParsedUser[];

                    // Basic validation/cleaning could happen here
                    const cleanedData = jsonData.map(row => ({
                        username: row.username ? String(row.username).trim() : '',
                        password: row.password ? String(row.password).trim() : 'Password@123', // Default if missing
                        department: row.department,
                        classId: row.classId
                    })).filter(user => user.username.length > 0);

                    resolve(cleanedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsBinaryString(file);
        });
    }
};
