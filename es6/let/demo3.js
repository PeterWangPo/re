//let没有变量声明提升作用，var有这个功能。let在声明前，不能使用该变量，否则报错
for(var i = 0; i < 3; i++){
	console.log(m); //undefined，if里面的声明提升了m变量
	if(false){
		var m = 123;
	}

	console.log(g);  //报错，g只在声明g的块级作用域有效，并且只能在声明后使用
	if(false){

		let g = 11;
	}
}
