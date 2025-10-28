from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Define a data model for POST requests
class Item(BaseModel):
    name: str
    price: float

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}

# Dynamic GET endpoint
@app.get("/greet/{username}")
def greet_user(username: str):
    return {"message": f"Hello, {username}!"}

# POST endpoint
@app.post("/items/")
def create_item(item: Item):
    return {"name": item.name, "price": item.price}