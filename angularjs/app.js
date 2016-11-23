/**
 * Created by wang on 2016/4/16.
 */
//function test($scope, $timeout){
//    var updateClock = function(){
//        $scope.clock = new Date().toLocaleString();
//        $timeout(function(){
//            updateClock();
//        },1000);
//    };
//    updateClock();
//}
function test($scope){
    $scope.clock = new Date().toLocaleString();
    setClock = function(){
        $scope.clock = new Date().toLocaleString();
    }
    setInterval(function(){
        $scope.$apply(setClock);
    },1000);
    setClock();
}
function phoneList($scope){
    $scope.phones = [
        {name : "li", email : "1111@123.com", age : 12, index : 10},
        {name : "wang", email : "2222@123.com", age : 15, index : 8},
        {name : "fei", email : "3333@123.com", age : 17, index : 1},
        {name : "fei", email : "3334@123.com", age : 1, index : 12},
    ];
    $scope.orderByValue = 'age';
}