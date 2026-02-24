# Warehouse-invetory-api

Прилоежнеи созданное для контроля имущества на складе  техники

# Технологии

backend: NodeJs + Express
database: PostgresSql
Контейнеризация: Docker

# Необходимый софт

Docker

# API-Эндпоинты

## GET:

/api/products - получить информацию о всех товарах
/api/products/{id} - получить информацию о товаре по id
/api/products/:id/transactions - получить историю движения товара 
/api/analytics - получить аналитику склада
/api/categories - получить информацию о категориях
/health - проверить работоспособность

## POST:

/api/products - создать новый товар 
Пример тела запроса:
{
    "name": "Название товара",
    "category_id": Id-категории товара,
    "sku": "Артикул товара",
    "description": "Описание товара",
    "quantity": Количество товара,
    "min_quantity": Минимальный остаток товара,
    "price": Цена товара
}
/api/products/:id/stock/in - добавить товар на склад
Пример тела запроса:
{
    "quantity": Количество,
    "notes": "Описание"
}
/api/products/:id/stock/out - списать товар со склада
Пример тела запроса:
{
    "quantity": 2,
    "notes": "Продажа клиенту"
}

## PUT:

/api/products/:id - Обновить информацию о товаре
Пример тела запроса:
{
    "name": "Название товара",
    "category_id": Id-категории товара,
    "sku": "Артикул товара",
    "description": "Описание товара",
    "quantity": Количество товара,
    "min_quantity": Минимальный остаток товара,
    "price": Цена товара
}
## DELETE:
/api/products/:id - Удалить товар

