//对象赋值
//对象赋值无需像数组那样有顺序,只要key对应上就行了,没有对应的就赋值undefined
var {foo, bar} = {foo: 'aaa', bar: 'bbb'}

//如果不对应呢？该如何赋值? ba是模式，bs才是真正的变量名
var {ba: bs} = {ba: 'aaaa'}
console.log(bs);


var node = {
	loc: {
		start: {
			line: 1,
			colum: 2
		}
	}
}
var { loc: { start: { line}}} = node
console.log(line);
//console.log(loc,start);//loc,start都是模式，不是真正的变量,所以保存


