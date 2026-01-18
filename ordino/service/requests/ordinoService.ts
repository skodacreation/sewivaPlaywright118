import { test, expect } from '@playwright/test';
import { oi, ApiServiceType } from "@ordino.ai/ordino-engine";
import { ordino, ordinoUpdate } from '../payloads/ordinoPayloads';

const http = oi.api(ApiServiceType.HTTP);

export class OrdinoService {

    private baseUrl: string = 'https://demoapi.ordino.ai/api/';
    
    constructor() {
        http.baseUrl(this.baseUrl);
    }
    
    async create_item() {
        http.baseUrl("https://demoapi.ordino.ai/api/");
        http.setUrl("items");
        const response = await http.requestPost(ordino);
        
        // Validate response status
        expect(response.status()).toBe(201);
        
        const responseBody = await response.json();
        
        // Validate response structure and properties
        expect(responseBody).toHaveProperty('status');
        expect(responseBody.status).toBe('success');
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Item created successfully');
        
        // Validate data object properties
        expect(responseBody.data).toHaveProperty('id');
        expect(responseBody.data).toHaveProperty('name');
        expect(responseBody.data.name).toBe(ordino.name);
        expect(responseBody.data).toHaveProperty('description');
        expect(responseBody.data.description).toBe(ordino.description);
        expect(responseBody.data).toHaveProperty('category');
        expect(responseBody.data.category).toBe(ordino.category);
        expect(responseBody.data).toHaveProperty('createdAt');
        expect(responseBody.data).toHaveProperty('updatedAt');
        
        // Store itemId for future use
        const itemId = responseBody.data.id;
        http.setValue("itemId", itemId);
        
        return responseBody.data;
    }

    async get_all_items() {
        http.setUrl(`items`);
        const response = await http.requestGet();
        
        // Validate response status
        expect(response.status()).toBe(200);
        
        const responseBody = await response.json();
        
        return responseBody;
    }

    async get_item_by_Id() {
        http.setUrl(`items/${http.getValue("itemId")}`);
        const response = await http.requestGet();
        
        // Validate response status
        expect(response.status()).toBe(200);
        
        const responseBody = await response.json();
        
        return responseBody;
    }

    async update_item() {
        http.setUrl(`items/${http.getValue("itemId")}`);
        const response = await http.requestPut(ordinoUpdate);
        
        // Validate response status
        expect(response.status()).toBe(200);
        
        const responseBody = await response.json();
        
        // Validate response structure and properties
        expect(responseBody).toHaveProperty('status');
        expect(responseBody.status).toBe('success');
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Item updated successfully');
        
        // Validate data object properties
        expect(responseBody.data).toHaveProperty('id');
        expect(responseBody.data).toHaveProperty('name');
        expect(responseBody.data.name).toBe(ordinoUpdate.name);
        expect(responseBody.data).toHaveProperty('description');
        expect(responseBody.data.description).toBe(ordinoUpdate.description);
        expect(responseBody.data).toHaveProperty('category');
        expect(responseBody.data.category).toBe(ordinoUpdate.category);
        expect(responseBody.data).toHaveProperty('createdAt');
        expect(responseBody.data).toHaveProperty('updatedAt');
        
        return responseBody.data;
    }

    async delete_item() {
        http.setUrl(`items/${http.getValue("itemId")}`);
        const response = await http.requestDelete();
        
        // Validate response status
        expect(response.status()).toBe(200);
        
        const responseBody = await response.json();
        
        // Validate response structure and properties
        expect(responseBody).toHaveProperty('status');
        expect(responseBody.status).toBe('success');
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Item deleted successfully');
        
        return responseBody;
    }

}