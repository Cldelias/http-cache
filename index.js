const http = require('http');
const url = require('url');
const {createHash} = require('crypto');

const resultados = {
	pessoas: [{id:1, nome: "Marcelo"}, {id:2, nome: "João"}, {id:3, nome: "Maria"}],
	carros: [{id:1, modelo: "Fusca"}, {id:2, modelo: "Gol"}, {id:3, modelo: "Palio"}],
	animais: [{id:1, nome: "Cachorro"}, {id:2, nome: "Gato"}, {id:3, nome: "Papagaio"}]
}

function calculateHash(str) {
	const hash = createHash('sha256');
	hash.update(str);
	return hash.digest('hex');
}

function cached(str, req, res) {
	if (req.headers['if-none-match'] === calculateHash(str)) {
		res.writeHead(304);
		res.end();
		return true;
	}
	return false
}

function writeHeader(res, payload) {
	res.writeHead(200, 
	{
		'Content-Type': 'application/json',
		'cache-control': "max-age=10, must-revalidate",
		"etag": calculateHash(payload)
	})
}

function getPayload(path) {
	switch (path) {
		case '/pessoas':
			return  JSON.stringify(resultados.pessoas)
		case '/carros' :
			return  JSON.stringify(resultados.carros)
		case '/animais':
			return  JSON.stringify(resultados.animais)
	}
}

function getItemPayload(path) {
	const id = parseInt(path.split('/')[2]);
	if (path.startsWith('/pessoas/')) {
		return resultados.pessoas.find(item => item.id === id)
	} else if (path.startsWith('/carros/')) {
		return resultados.carros.find(item => item.id === id)
	} else if (path.startsWith('/animais/')) {
		return resultados.animais.find(item => item.id === id)
	}
}

const server = http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true);
	const path = parsedUrl.path;
	console.info(path);
   if (path == '/pessoas' || path == '/carros' || path == '/animais') {
		const payload = getPayload(path)
	    if (cached(payload, req, res)) {
			return;
		}
		writeHeader(res, payload)
		res.end(payload);
	} else if (path.startsWith('/pessoas/') || path.startsWith('/carros/') || path.startsWith('/animais/') ) {
		const item = getItemPayload(path)
		if (item) {
			if (cached(JSON.stringify(item), req, res)) {
				return;
			}
			writeHeader(res, JSON.stringify(item))
			res.end(JSON.stringify(item));
		} else {
			res.writeHead(404, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ message: 'Página não encontrada' }));
		}
	}
});


const port = 8080;
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
