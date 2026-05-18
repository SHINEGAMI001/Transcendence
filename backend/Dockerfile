FROM python:latest

WORKDIR /bapp

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["uvicorn", "src.asgi:application", "--host", "0.0.0.0", "--port" , "8000", "--reload"]