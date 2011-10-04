function SampleWithoutReplacement(valueArray) {
    this.values = valueArray.slice();
}

SampleWithoutReplacement.prototype.getItem = function () {
    var i, result;

    result = null;

    if (this.values.length) {
        i = Math.floor(Math.random() * this.values.length);
        result = this.values[i];
        this.values[i] = this.values[this.values.length - 1];
        this.values.pop();
    }

    return result;
};


SampleWithoutReplacement.prototype.getAllItems = function () {
    var i, iValue, result;

    result = [];
    iValue = 0;

    while (this.values.length) {
        i = Math.floor(Math.random() * this.values.length);
        result[iValue] = this.values[i];
        this.values[i] = this.values[this.values.length - 1];
        this.values.pop();
        iValue++;
    }

    return result;
};