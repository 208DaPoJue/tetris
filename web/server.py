from aiohttp import  web

app = web.Application()

app.router.add_static('/', './web')

web.run_app(app)