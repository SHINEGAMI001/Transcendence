# this branch contains the docker infrastructure for the project

## Whats working now :

### Frontend
- Frontend environment setuped (React app + Javascript + Vite development server)
- React app running on the browser [localhost:5173](http://localhost:5173)
- Frontend developer can start working on dynamic user interface.
- All the necessary files to code are ready to use in [frontend/](./frontend) directory
- Docker volume (bind mounts) for react app is ready to use, you can code directly from the src directory [frontend/src](./frontend/src) on your host device without needing to rebuild the container for changes to take.
- Also some usefull tools (you will probably use) are installed like:
    - *css tailwind* for designing the user interface.
    - *react router* for multi page react support.
    - *axios* to communicate to the backend (http requests).
- Frontend will do 4 main things:
    - show login/register pages
    - show the game UI
    - talk to the backend
    - switch between pages

### Backend
- Backend enviroment setuped (Django project + python)
- Necessary packages installed :
    - *Django framerwok*
    - *djangorestframework* for rest api
    - *Psycopg2-binary* for connecting to the database
    - *django-cors-headrs* allowing differnet origins to connect securely to backend needed for frontend requests
- Django project server is installed and ready to use, you will find it running on [localhost:8000](http://localhost:8000)
- Same as frontend docker bind mount volumes setuped on [backend/src](./backend/src), you can code directly from that directory without needing to rebuild the container for changes to take place (server reloads whenever there is a change in code).

### Postgres Database
- Postgres db added to `docker-compose.yaml`
- Database configured and connected to the backend (Django server), u can check [backend/src/settings.py](./backend/src/settings.py)
- Named volume setuped for database (migration is necessary for datatables updates on your machine)
- All the necessary system data tables for user authentication are created and connected to django (needed for login, registration and later the game, matches and any needed data table for the project is connected to the *auth_user_model* datatable)
- admin panel for data base navigation is ready to use (access it thru [localhost:8000/admin](http://localhost:8000/admin)), but before that:
    - You must setup a super user to access [admin panel](http://localhost:8000/admin) with:
```bash
    docker compose up --build -d
    docker exec -it backend bash
    python manage.py createsuperuser # run inside the container
```
- then
```bash
    docker compose up --build -d #build and run containers in detach mode
    docker exec -it backend bash #access the container
    python manage.py migrate #needed for datatables updates on ur machine (u will not see any data tables if u didnt run this command)
```
- Now u can see all the datatables models that exists in the admin panel
- You can create datatables or add fields to a datatable with models, for more information about [models](https://docs.djangoproject.com/en/6.0/topics/db/models/)
- a small note u should always make migrations after adding a model (adding data table or a field into the data table or updating the database structure) with:
```bash
#inside backend container
python manage.py makemigrations #creates database blueprint
python manage.py migrate #runs sql commands to create that blueprint
 #after creating models django knows but database doesnt so u should always do this for updates to take place in database (this doesnt apply for actual data only when database structure changes)
```
### backend available apis
* check [views.py](backend/users/views.py) for views functions and [urls.py](backend/users/urls.py) for url routing
- available endpoints:
    - [POST] localhost:8000/api/auth/register/
    - [POST] localhost:8000/api/auth/login/
    - [GET] localhost:8000/api/profile/me
    - [PUT] localhost:8000/api/avatar/update
    - [GET] localhost:8000/api/auth/logout
    - [PUT] localhost:8000/api/profile/update
    - [DELETE] localhost:8000/api/profile/delete
    - [GET] localhost:8000/api/users/search/
        ```bash
        example request url:
        localhost:8000/api/users/search/?q=username&xp_lt=xp&order_by=wins&desc=1
        ```
    - [GET] localhost:8000/api/users/profile/pub/<fixed_username>
