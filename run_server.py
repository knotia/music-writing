import uvicorn

if __name__ == "__main__":
    print("Starting Musical Thought Translation API Server...")
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
