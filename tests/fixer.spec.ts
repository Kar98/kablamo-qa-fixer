import { test, expect } from '@playwright/test';

test.describe('API tests', () =>{
    /**API /accounts/ . It has the following parameters:
     * active : boolean (If true, returns active accounts . Mandatory)
     * search : string (Will search for the accounts based on the string provided . Not mandatory)
    */

    /** API /transfer/ . It has the following parameters:
     * from : number . Account number to transfer from
     * to : number . Account number to transfer to
     * amount : number. Total money amount
     */

    test('A user will always have an account', async ({ request }) => {
        let response = await request.get('https://kablamo.bank.api/accounts', {headers: { Authorization: 'Bearer ey.123' }});
        let json = await response.json();
        expect(json.data.length).toBeGreaterThan(0);
    });

    test('Mandatory field testing', async ({ request }) => {
        let response = await request.get('https://kablamo.bank.api/accounts', {headers: { Authorization: 'Bearer ey.123' }});
        let response1 = await request.get('https://kablamo.bank.api/accounts?active=true', {headers: { Authorization: 'Bearer ey.123' }});
        let response2 = await request.get('https://kablamo.bank.api/accounts?search=savings', {headers: { Authorization: 'Bearer ey.123' }});
        let response3 = await request.get('https://kablamo.bank.api/accounts?active=true&search=savings', {headers: { Authorization: 'Bearer ey.123' }});
        // Check the results
        expect(response).not.toBeOK();
        expect(response1).toBeOK();
        expect(response2, 'Error is returned').not.toBeOK();
        expect(response3).toBeOK();
    });

    test('Successful money transfer scenario', async ({ request }) => {
        /** Transfer half of available money and ensure there is a transaction ID with the amount transfered */
        const accountId = 123;
        const accountId2 = 321;
        const current_balance = (await (await request.get('https://kablamo.bank.api/accounts?active=true')).json()).data.amount;
        let response = await request.put('https://kablamo.bank.api/transfer', { headers: { Authorization: 'Bearer ey.123'},
        data:
        {
            from: accountId,
            to: accountId2,
            amount: current_balance / 2
        }
        });
        // Check response is correct. 
        let json = await response.json();
        await expect(response).toBeOK();
        expect(json.data.trasactionId).toContain("ID");
        expect(json.data.amount).toEqual(current_balance / 2);
        // Check that the balance has been updated
        let new_balance = (await (await request.get('https://kablamo.bank.api/accounts?active=true')).json()).data.amount;
        expect(new_balance).toEqual(current_balance / 2);
    });
});

test.describe('Front end tests', () =>{
    function sleep(miliseconds: number) {
        return new Promise((resolve) => {
          setTimeout(resolve, miliseconds);
        });
      }

    test('Check layout', async ({ page }) => {
        await page.goto("https://kablamo.bank/accounts");
        await sleep(1000);
        if(process.env.ENVIRONMENT == 'dev'){
            expect(await page.locator("[data-testid='dev-table']").isVisible()).toBeTruthy();
        }else if (process.env.ENVIRONMENT == 'uat'){
            expect(await page.locator("[data-testid='uat-table']").isVisible()).toBeTruthy();
        }
    });

    test('Sort transaction table in ascending order', async ({ page }) => {
        await page.goto("https://kablamo.bank/accounts");
        // Click transaction value, which is index 3, to sort the table
        await page.locator("[role=header]").nth(3).click();
        // Confirm transactions are in ascending order
        let value1 = await page.locator("//div[@row]").nth(0).locator("xpath=/div[role=column]").nth(3).textContent() as string;
        let value2 = await page.locator("//div[@row]").nth(1).locator("xpath=/div[role=column]").nth(3).textContent() as string;
        let value3 = await page.locator("//div[@row]").nth(2).locator("xpath=/div[role=column]").nth(3).textContent() as string;
        expect(parseFloat(value1)).toBeLessThan(parseFloat(value2));
        expect(parseFloat(value2)).toBeLessThan(parseFloat(value3));
    });
});