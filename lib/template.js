// 모듈로 분리


var template = {

	// list 함수가 먼저 호출되어야 한다
	list: function (fileList) {
		var list = '<ul>';
		var i = 0;
		while(i < fileList.length) {
			list += `<li><a href="/?id=${fileList[i]}">${fileList[i]}</a></li>`;
			i++;
		}
		list += '</ul>';
		return list;
	},

	// html 함수는 list 함수보다 나중에 호출되어야 한다
	html: function (title, list, body, control, authStatus = false) {
		
		var loginStatus = (authStatus === true) ? 'logout' : 'login';
		var loginLink = (authStatus === true) ? 'logout_process' : 'login';
		
		return `
		<!doctype html>
		<html>
		<head>
			<title>WEB - ${title}</title>
			<meta charset="utf-8">
		</head>
		<body>
			<a href="/${loginLink}">${loginStatus}</a>
			<h1><a href="/">WEB</a></h1>
			${list}
			${control}
			${body}
		</body>
		</html>`;
	}
};


module.exports = template;		// 외부에서 사용하도록