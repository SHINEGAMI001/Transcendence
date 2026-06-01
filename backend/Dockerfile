FROM python:latest

WORKDIR /bapp

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

RUN mkdir -p /bapp/staticfiles

# Copy entrypoint script
COPY entrypoint.sh /bapp/
RUN chmod +x /bapp/entrypoint.sh

# Run entrypoint which collects static files and starts server
CMD ["/bin/bash", "/bapp/entrypoint.sh"]