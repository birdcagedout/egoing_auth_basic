// 생활코딩(egoing)님의 nodejs 강의: node.js 기초
// 
// 블로그: https://opentutorials.org/module/3549/21032
// 유튜브: https://www.youtube.com/playlist?list=PLuHgQVnccGMA9QQX5wqj6ThK7t2tsGxjm
//
// pm2 사용법: https://www.youtube.com/watch?v=KzjTCREOIkk&list=PLuHgQVnccGMA9QQX5wqj6ThK7t2tsGxjm&index=39
// 설치: npm install pm2 -g
// 실행: pm2 start main.js --watch
// 정지: pm2 stop main(id)
// 전부정지: pm2 kill
// 목록: pm2 list
// 모니터링: pm2 monit (나갈 때는 q)
// 내부관찰: pm2 log (나갈 때는 Ctrl + C)
// 실행하여 관찰도 하면서 + 로그도 확인: pm2 start .\main.js --watch --no-daemon
// ==> 이경우 문제점: 가끔 Ctrl + C로도 꺼지지 않는다 + ./data/파일 생성시 node가 꺼졌다가 켜진다
// ==> 해결법:  pm2 start .\main.js --watch --ignore-watch="data/* lib/*" --no-daemon


var http = require('http');
var fs = require('fs');
var url = require('url');
const path = require('path');
var qs = require('querystring');

// var template --> ./lib/template 모듈로 분리
var template = require('./lib/template.js');

// 보안(http://localhost:3000/?id=../password.js 처럼 요청이 들어오는 경우 상위 디렉토리에 접근하여 정보를 빼갈 수 있다)
const sanitizeHtml = require('sanitize-html');

var cookie = require('cookie');


const EMAIL = 'muzom97@naver.com';
const PASSWORD = '1111';							// cookie로 파싱된 값은 string임
const NICK = 'muzom97'


// 쿠키로 로그인 검증하는 함수
function authenticate(request, response) {
	// 로그인 여부를 체크하는 변수
	var isLoggedOn = false;

	// 쿠키 파싱된 값
	var cookies = request.headers.cookie !== undefined ? cookie.parse(request.headers.cookie) : {};
	// console.log(cookies);							// { email: 'muzom97@naver.com', password: '1111', nickname: 'muzom97' }

	// 쿠키 값에 따라 로그인 상태 변경
	if(cookies.email === EMAIL && cookies.password === PASSWORD) {
		isLoggedOn = true;
	}
	// console.log(isLoggedOn);

	return isLoggedOn;
}


var app = http.createServer(
	function(request,response){
    var _url = request.url;
		// console.log(_url);						// /?id=HTML

		var queryData = url.parse(_url, true).query;
		// console.log(queryData);					// [Object: null prototype] { id: 'HTML' }
		// console.log(queryData.id);				// HTML

		var pathname = url.parse(_url, true).pathname;

		// 쿠키로 로그인 검증 결과
		var isLoggedOn = authenticate(request, response);

		

		// 요청path가 정상인 경우
		if(pathname ==='/') {

			// 홈(WEB)
			if(queryData.id === undefined) {
				fs.readdir('./data', function(err, fileList) {
					// console.log(fileList);					// [ 'CSS', 'HTML', 'JavaScript' ]
					var title = 'Welcome';
					var description = 'Hello, node.js';
	
					var list = template.list(fileList);
					var html = template.html(title, list, `<h2>${title}</h2>${description}`, `<a href="/create">create</a>`, isLoggedOn);
		
					response.writeHead(200);
					response.end(html);
				});
			}

			// 그 외(HTML, CSS ,JavaScript)
			else {
				fs.readdir('./data', function(err, fileList) {
					// console.log(fileList);					// [ 'CSS', 'HTML', 'JavaScript' ]

					var filteredId = path.parse(queryData.id).base;
					fs.readFile(`./data/${filteredId}`, 'utf-8', function(err, description) {
						var title = queryData.id;
						var sanitizedTitle = sanitizeHtml(title);
						var sanitizedDescription = sanitizeHtml(description);
						
						var list = template.list(fileList);
						var html = template.html(title, list, 
							`<h2>${sanitizedTitle}</h2>${sanitizedDescription}`, 
							`<a href="/create">CREATE</a> 
							<a href="/update?id=${sanitizedTitle}">UPDATE</a> 
							<form action="/delete_process" method="post" onsubmit="alert('${sanitizedTitle}항목을 삭제하시겠습니까?');">
								<input type="hidden" name="id" value="${sanitizedTitle}">
								<input type="submit" value="delete">
							</form`,
							isLoggedOn);															// delete를 GET방식으로 링크를 드러내서는 안 되므로 POST방식으로 하기 위해 form 사용

						response.writeHead(200);
						response.end(html);
					});
				});
			}
		}

		// 글쓰기(create)
		else if(pathname === '/create') {

			// 로그인 상태가 아니라면 튕겨내기
			if(!isLoggedOn) {
				response.end('<h1>Login required!!</h1><p><a href="/login">login</a>');
				return false;			// 이 부분이 꼭 필요!! ==> 함수를 종료시키지 않으면 아래 부분이 계속 실행됨
			}


			fs.readdir('./data', function(err, fileList) {
				// console.log(fileList);					// [ 'CSS', 'HTML', 'JavaScript' ]
				var title = 'WEB - create';

				var list = template.list(fileList);
				var html = template.html(title, list, `
					<form action="/create_process" method="post">
						<p>
							<input type="text" name="title" placeholder="title">
						</p>
						<p>
							<textarea name="description" placeholder="description"></textarea>
						</p>
						<p>
							<input type="submit">
						</p>
					</form>
				`, 
				'',
				isLoggedOn
				);
	
				response.writeHead(200);
				response.end(html);
			});
		}

		// 글쓰기 요청을 처리(create_process)
		else if(pathname === '/create_process') {

			// POST로 전송된 data 처리
			var body = '';

			// 서버가 POST data를 (조각조각 순차적으로) 수신할 때마다 호출되는 event listener
			request.on('data', function(data) {
				body += data;

				// 너무 큰(대략 1MB) 데이터가 들어왔을 때 접속을 끊어버리는 예방장치
				if(data.length > 1e6) request.socket.destroy();
			});

			// 서버에 더이상 들어오는 data가 없으면 정보수신이 끝났으므로 이때 호출되는 event listener
			request.on('end', function(data) {
				var post = qs.parse(body);
				// console.log(post);					//  [Object: null prototype] { title: 'node.js', description: '노드가 짱짱맨' }

				var title = post.title;
				var description = post.description;
				fs.writeFile(`./data/${title}`, description, 'utf-8', function(err) {
					if(err) throw err;

					response.writeHead(302, {Location: `/?id=${title}`});				// 글쓴 목록이 추가되었음을 보여주는 페이지로 redirection (301=영구이동, 302=임시이동)
					response.end();																							// title이 한글일 때는 Location: `/?id=${encodeURI(title)}
				});
			});
		}

		// 수정(update)하기
		else if(pathname === '/update') {

			// 로그인 상태가 아니라면 튕겨내기
			if(!isLoggedOn) {
				response.end('<h1>Login required!!</h1><p><a href="/login">login</a>');
				return false;			// 이 부분이 꼭 필요!! ==> 함수를 종료시키지 않으면 아래 부분이 계속 실행됨
			}


			fs.readdir('./data', function(err, fileList) {
				// console.log(fileList);					// [ 'CSS', 'HTML', 'JavaScript' ]

				var filteredId = path.parse(queryData.id).base;
				fs.readFile(`./data/${filteredId}`, 'utf-8', function(err, description) {
					var title = filteredId;
					
					var list = template.list(fileList);
					var html = template.html(title, list,
						`
						<form action="/update_process" method="post">
						<p>
							<input type="hidden" name="id" value=${title}>															<!-- 수정 전 원래 title = id -->
							<input type="text" name="title" placeholder="title" value=${title}>					<!-- 수정 후 title = title -->
						</p>
						<p>
							<textarea name="description" placeholder="description">${description}</textarea>
						</p>
						<p>
							<input type="submit">
						</p>
					</form>
						`, 
						`<a href="/create">create</a> <a href="/update?id=${title}">update</a>`,
						isLoggedOn
					);

					response.writeHead(200);
					response.end(html);
				});
			});
		}

		// 수정 요청 처리하기(update_process)
		else if(pathname === '/update_process') {
			// POST로 전송된 data 처리
			var body = '';

			// 서버가 POST data를 (조각조각 순차적으로) 수신할 때마다 호출되는 event listener
			request.on('data', function(data) {
				body += data;

				// 너무 큰(대략 1MB) 데이터가 들어왔을 때 접속을 끊어버리는 예방장치
				if(data.length > 1e6) request.socket.destroy();
			});

			// 서버에 더이상 들어오는 data가 없으면 정보수신이 끝났으므로 이때 호출되는 event listener
			request.on('end', function(data) {
				var post = qs.parse(body);
				// console.log(post);					//  [Object: null prototype] { title: 'node.js', description: '노드가 짱짱맨' }

				var id = post.id;
				var title = post.title;
				var description = post.description;
				// console.log(post);

				/*
				// 일단 파일을 쓰고
				fs.writeFile(`./data/${title}`, description, 'utf-8', function(err) {
					if(err) throw err;

					response.writeHead(302, {Location: `/?id=${title}`});
					response.end();
				});

				// id와 title이 다르다면 id(예전 title)로 된 파일을 지워준다
				if(id !== title) {
					fs.rm(`./data/${id}`, function(err) {
						if(err) throw err;
					});						
				}
				*/

				fs.rename(`data/${id}`, `data/${title}`, function(error){
					if(error) throw error;
					fs.writeFile(`data/${title}`, description, 'utf8', function(err){
						if(err) throw err;
						response.writeHead(302, {Location: `/?id=${title}`});
						response.end();
					})
				});
			});
		}

		// 삭제 요청 처리하기(delete_process)
		else if(pathname === '/delete_process') {

			// 로그인 상태가 아니라면 튕겨내기
			if(!isLoggedOn) {
				response.end('<h1>Login required!!</h1><p><a href="/login">login</a>');
				return false;			// 이 부분이 꼭 필요!! ==> 함수를 종료시키지 않으면 아래 부분이 계속 실행됨
			}


			// POST로 전송된 data 처리
			var body = '';

			// 서버가 POST data를 (조각조각 순차적으로) 수신할 때마다 호출되는 event listener
			request.on('data', function(data) {
				body += data;

				// 너무 큰(대략 1MB) 데이터가 들어왔을 때 접속을 끊어버리는 예방장치
				if(data.length > 1e6) request.socket.destroy();
			});

			// 서버에 더이상 들어오는 data가 없으면 정보수신이 끝났으므로 이때 호출되는 event listener
			request.on('end', function(data) {
				var post = qs.parse(body);
				// console.log(post);					//  [Object: null prototype] { title: 'node.js', description: '노드가 짱짱맨' }

				var id = post.id;
				var filteredId = path.parse(id).base;
				fs.unlink(`./data/${filteredId}`, function(err){
					response.writeHead(302, {Location: `/`});
					response.end();
				});
			});
		}

		// 로그인 화면(/login)
		else if(pathname === '/login') {
			fs.readdir('./data', function(err, fileList) {
				// console.log(fileList);					// [ 'CSS', 'HTML', 'JavaScript' ]
				var title = 'Login';

				var list = template.list(fileList);
				var html = template.html(title, list, 
					`<form action="login_process" method="post">
						<p>
						<input type="text" name="email" placeholder="email">
						<input type="password" name="password" placeholder="password">
						<input type="submit">
						</p>
					</form>`, 
					`<a href="/create">create</a>`,
					// isLoggedOn
				);
	
				response.writeHead(200);
				response.end(html);
			});
		}

		// 로그인 처리(/login_process)
		else if(pathname === '/login_process') {
			// POST로 전송된 data 처리
			var body = '';

			// 서버가 POST data를 (조각조각 순차적으로) 수신할 때마다 호출되는 event listener
			request.on('data', function(data) {
				body += data;

				// 너무 큰(대략 1MB) 데이터가 들어왔을 때 접속을 끊어버리는 예방장치
				if(data.length > 1e6) request.socket.destroy();
			});

			// 서버에 더이상 들어오는 data가 없으면 정보수신이 끝났으므로 이때 호출되는 event listener
			request.on('end', function(data) {
				var post = qs.parse(body);

				var email = post.email;
				var password = post.password;

				// 로그인 성공시
				if(email === EMAIL && password === PASSWORD) {
					// response에 /로 redirection 하면서 + 쿠키 세팅
					// ==============================================================
					// 현실에선 절대 금지 ==> hash, salt, key stretching 등의 방법으로 암호화
					// 모듈: PBKDF2, bcrypt 등
					// ==============================================================
					response.writeHead(302, {
						'Set-Cookie' : [
							`email=${email}`,
							`password=${password}`,
							`nickname=${NICK}`
						],
						Location: '/'
					});
					response.end();
				} 
				// 로그인 실패시
				else {
					response.end("<h1>Who?<h1>");
				}
			});

		}

		// 로그아웃 처리(/logout_process)
		else if(pathname === '/logout_process') {
			// POST로 전송된 data 처리
			var body = '';

			// 서버가 POST data를 (조각조각 순차적으로) 수신할 때마다 호출되는 event listener
			request.on('data', function(data) {
				body += data;

				// 너무 큰(대략 1MB) 데이터가 들어왔을 때 접속을 끊어버리는 예방장치
				if(data.length > 1e6) request.socket.destroy();
			});

			// 서버에 더이상 들어오는 data가 없으면 정보수신이 끝났으므로 이때 호출되는 event listener
			request.on('end', function(data) {
				var post = qs.parse(body);

				var email = post.email;
				var password = post.password;

				// response에 /로 redirection 하면서 + 쿠키 삭제
				response.writeHead(302, {
					'Set-Cookie' : [
						`email=; Max-Age=0`,
						`password=; Max-Age=0`,
						`nickname=; Max-Age=0`
					],
					Location: '/'
				});
				response.end();
			});

		}

		// 요청path가 잘못된 경우
		else {
			response.writeHead(404);
			response.end("Not Found");
		}
	}
);

app.listen(3000);