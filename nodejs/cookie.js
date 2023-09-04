// 생활코딩 Web2 쿠키와 인증 강의
// https://www.youtube.com/watch?v=i51xW3eh-T4&list=PLuHgQVnccGMDo8561VLWTZox8Zs3K7K_m
// 쿠키의 정의, 사용법, 각종 옵션 등을 아주 간단한 서버로 먼저 맛보기한다.
// 현재 파일을 실습한 다음 main.js에 쿠키를 추가해본다.



var http = require('http');
var cookie = require('cookie');


http.createServer(function(request, response) {

	// 2) 쿠키 읽어보기 (클라이언트 -> 서버) ==> 철자 주의: cookies 아님!!
	// console.log(request.headers.cookie);											// yummy_cookie=choco; tasty_cookie=strawberry

	// 3) 쿠키 읽기 (모듈 사용) ==> 문제점: 쿠키가 없는 경우(request.headers.cookie = undefined) 에러 발생
	if(request.headers.cookie !== undefined) {
		var cookies = cookie.parse(request.headers.cookie);					// { yummy_cookie: 'choco', tasty_cookie: 'strawberry' }
		// console.log(cookies);
	}

	// 4) 쿠키의 라이프타임
	// - Session 쿠키: 세션이 종료될 때 삭제된다
	// - Permanent 쿠키: 세션 쿠키 형태 + Expires 속성에 명시된 "날짜"에 삭제되거나, Max-Age 속성에 명시된 "기간"(현재 시간 기준) 이후에 삭제됩니다.


	// 5) Secure 속성
	// - HTTPS 프로토콜을 통화 암호화된 request에만 사용 가능한 쿠키, '이름=값; Secure' 형태로 Secure 속성을 넣어주면 된다


	// 6) HttpOnly 속성
	// - 웹브라우저와 웹서버가 통신할 때만 사용가능한 쿠키 (자바스크립트의 document.cookie로 접근하는 것을 막는다)


	// 7) Path 속성: 특정 path에서만 유효한 cookie: Path=<특정Path>
	// - 만약 Path='/doc'으로 설정했다면 ==> '/doc', '/doc/', '/doc/web/', '/doc/web/http'와 매치된다. 즉, /doc 또는 그 하위 경로에서는 유효한 쿠키가 된다


	// 8) Domain 속성: 쿠키의 유효범위를 더 넓히기 위해 사용
	// - Domain 속성이 없는 경우: (기본값으로) 해당 쿠키를 설정한 호스트(접속한 바로 그 주소)만을 유효한 범위로 본다.
	// 		ex. developer.mozilla.org로 로그인 후 쿠키를 확인하면 auth-cookie, preferredlocale 2개는 Domain 속성이 없으므로 기본값 developer.mozilla.org로 설정되어 있다. 
	//				이 상태에서 mozilla.org로 이동하면 이 2개의 쿠키는 유효하지 않기 때문에 사라진다.
	//				그런데, 나머지 3개의 쿠키(_gid, _ga, _ga_MQ7767QQQW)는 Domain=mozilla.org로 설정되어 있기 때문에 Domain 속성이 .mozilla.org로 설정되어 있다.
	//				이 3개의 쿠키들은 현재 developer.mozilla.org 주소에서 mozilla.org로 이동하더라도 쿠키가 유효하기 때문에 사라지지 않는다.
	// - Domain 속성이 있는 경우: 해당 쿠키를 설정한 호스트(developer.mozilla.org)가 쿠기의 Doamin 속성을 최상위 Domain(mozilla.org)로 설정한 경우, 쿠키의 유효범위는 *.mozilla.org로 넓어진다.


	// 1) 쿠키 생성 (서버 -> 클라이언트)
	// 최초 클라이언트의 http request에 대하여, 서버의 http response header에 'Set-Cookie': <쿠키이름>=<쿠키값> 형태로 적어준다
	// 쿠키 1개당 'name=value' 형태로 'Set-Cookie'라는 키의 값으로 넣되, 2개 이상이면 배열 형태로 묶어준다
	response.writeHead(200, {
		'Set-Cookie': [
			// 4-1) Session Cookie 2개
			'yummy_cookie=choco',
			'tasty_cookie=strawberry',
			
			// 4-2) Permanent Cookie: 하나의 쿠키는 여러가지 속성을 가질 수 있고, 각 속성은 ;로 구분하여 적는다. 세션을 꺼도, 브라우저 껐다 켜도 쿠키 살아있다.
			// `my_permanent_cookie=value; Max-Age=${60*20}`,				// 60초 * 20 = 20분

			// 5-1) Secure 속성: 서버의 response header에 Secure cookie를 정해두었음에도 불구하고, 클라이언트의 request header를 보면 Secure 속성이 빠져있다 ==> https가 아니므로
			// `my_secure_cookie=value; Secure`,

			// 6-1) HttpOnly 속성
			// 'my_httponly_cookie=value; HttpOnly',

			// 7-1) Path 속성
			'my_path_cookie=value; Path=/cookie',					// 'http://localhost:3000/cookie' 경로로 접근하면 유효한 쿠키, 'http://localhost:3000'로 접근하면 유효하지 않은 쿠키

			// 8-1) Domain 속성 - sub domain을 테스트해볼 수가 없으므로 생략

		]
	});

	


	response.end('Cookie!!');
}).listen(3000);
