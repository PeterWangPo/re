//块级作用域demo2，
var a = [];
function t(){
	for(var i = 0; i < 3; i++){
		a[i] = function(){
			console.log(i);
		}
	}
}
t();
a[0]();
a[1]();
a[2]();


var b = [];
function tt(){
	for(let m = 0; m < 3; m++){
		b[m] = function(){
			console.log(m);	
		}	
	}	
}

tt();
b[0]();
b[1]();
b[2]();
