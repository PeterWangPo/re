//块级作用域
{
	let a = 1;
	var b = 2;
}
console.log(a); //errot
console.log(b); //undefined

var a = [];
for (var i = 0; i < 3; i++){
	a[i] = function(){
		console.log(i);
	}
}
a[2]();     //2
a[1]();     //2
a[0]();     //2



var b = [];
for (let j = 0; j < 3; j++){ 
	b[j] = function(){
		console.log(j);
	}
}
b[2]();    //2
b[1]();    //1 
b[0]();    //0


//var 变量提升，而let无变量提升的功能，只能在声明后使用,否则报错
console.log(c);    //undefined
console.log(d);    //error

var c;
let d;


//暂时性死去    只要在块里面声明了let变量，那么在声明前，块里面不能使用声明的变量，否则无论改变量之前是什么状态都会报错
var m = 123;
if(true){
	console.log(m);     //报错，尽管m是一个全局变量
	var m  = 111;
	console.log(m);     //报错，尽管声明是一个局部变量
	let m;
	console.log(m);     //undefined
}

//隐式死区
//参数中x=y,将y赋值给x,此时y没有定义，属于死区,经过后面定义y=2,只要在未定义钱使用，就属于死区，访问就会报错

function bar(x = y; y =2){
	return [x, y];
}
bar();   //报错

function  bar(x = 2; y = x){
	return [x, y];
}
bar();       //[2,2];


#不允许重复声明同一个变量，无论在函数内或者函数外，如果变量a，已经声明，不管a变量是var声明还是let声明，那么在不能使用let再次声明a变量，否则报错
var aa = 123;
var aa = 234; //不会报错
let aa = 444; //报错
function t(){
	let aa = 44;
	let aa =1; // 报错
}

//块级作用域可任意嵌套，但是只能访问自己块级作用域里面的变量
function tt(){
	let aa = 12;
	if(true){
		let aa = 15; //这样不会报错，这是另外一个块级作用域
	}
}

//块级作用域里面声明函数，建议不这么搞，如果块级作用域要声明函数，就声明变量函数。
