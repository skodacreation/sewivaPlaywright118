import { test, expect } from '@playwright/test';
import { OrdinoService } from '../../service/requests/ordinoService';

 const ordinoService = new OrdinoService();

test.describe.serial('Ordino Service API Tests', () => {

    test('1. Create new item (POST)' ,async () => {       
        await ordinoService.create_item();
    })

    test('2. Get all items (GET)', async () => {
        await ordinoService.get_all_items();
    })

    test('3. Get item by ID (GET)', async () => {
        await ordinoService.get_item_by_Id();
    })

    test('4. Update item (PUT)', async () => {
        await ordinoService.update_item();
    })

    test('5. Delete item (DELETE)', async () => {
        await ordinoService.delete_item();
    })
});