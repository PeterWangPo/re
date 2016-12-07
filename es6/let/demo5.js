//同一个块级作用域里面不能重复声明,用let声明变量，无论声明前改变量是什么状态，只有该变量之前声明过，就无法再次声明为let变量，否则报错,同理，声明过的let变量，无法再次声明，用var声明也不行
function t(){
	var a = 1;
	let a = 2; //报错
}
function tt(){
	let a = 1;
	let a = 2; //error
}
function ttt(){
	let a = 1;
	var a =2;  //error
}

t();
tt();
ttt();
