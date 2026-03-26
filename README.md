# this branch contains the docker infrastructure for the project

## Whats working now :

### Frontend
- Frontend environment setuped (React app + Javascript + Vite development server)
- React app running on the browser [http://localhost:5173]()
- Frontend developer can start working on dynamic user interface.
- All the necessary files to code are ready to use in [./frontend/](./frontend) directory
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
- Django project server is installed and ready to use, you will find it running on http://localhost:8000
- Same as frontend docker bind mount volumes setuped on [backend/src](./backend/src), you can code directly from that directory without needing to rebuild the container for changes to take place (server reloads whenever there is a change in code).

