var _$R=[];
function $R(f) {
    _$R.push(f);
}
function $READY() {
    for (var i = 0; i < _$R.length; ++i) {
        _$R[i]();
    }
}