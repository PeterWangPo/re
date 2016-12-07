//暂时性死区
//也就是在声明let变量的块级作用域中，在声明前，不能使用该变量,否则就报错
//出了demo3里面的显式的使用未声明的变量报错，还有隐式的使用

function tt(x = 2, y = x){
	console.log([x, y]);
}

function t(x = y, y = 2){
	return [x, y];
}
tt(); //[2,2]
t();  //报错
