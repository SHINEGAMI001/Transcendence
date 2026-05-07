FROM python:latest

WORKDIR /bapp

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "src.asgi:application"]