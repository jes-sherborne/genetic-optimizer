function SimpleTSP(options) {
    var i, j;

    this.variableCount = options.nodeList.length;
    this.node = options.nodeList.slice();
    this.eachVariableList = []; //Just an array value for each variable. We use it for sampleWithoutReplacement
    this.nodeDistance = null; //The distance from node to node

    for (i = 0; i < this.variableCount; i++) {
        this.eachVariableList.push(i);
    }

    this.nodeDistance = new Array(this.variableCount);
    for (i = 0; i < this.variableCount; i++) {
        this.nodeDistance[i] = new Array(this.variableCount);
        for (j = 0; j < this.variableCount; j++) {
            if (i != j) {
                this.nodeDistance[i][j] = this.getDistance(this.node[i], this.node[j]);
            } else {
                this.nodeDistance[i][j] = 0;
            }
        }
    }

}

SimpleTSP.prototype.getDistance = function (node1, node2) {
    return Math.sqrt((node1.x - node2.x) * (node1.x - node2.x) + (node1.y - node2.y) * (node1.y - node2.y));
};

SimpleTSP.prototype.getValue = function (x) {
    var i, result;

    result = 0;
    for (i = 1; i < this.variableCount; i++) {
        result += this.nodeDistance[x[i]][x[i - 1]];
    }

    return result;
};

SimpleTSP.prototype.mutate = function (x) {
    var i, j, t;

    i = Math.floor(Math.random() * this.variableCount);
    j = Math.floor(Math.random() * this.variableCount);
    t = x[i];
    x[i] = x[j];
    x[j] = t;
};

SimpleTSP.prototype.getRandomIndividual = function () {
    var i, result, sampler;

    sampler = new SampleWithoutReplacement(this.eachVariableList);
    return sampler.getAllItems();

};

SimpleTSP.prototype.crossover = function (x1, x2) {
    var crossPoint, x1Copy;

    crossPoint = Math.floor(Math.random() * this.variableCount);
    x1Copy = x1.slice(); //We need to keep a clean copy, becuase we change it in place

    this.crossoverMerge(x1, x2, crossPoint);
    this.crossoverMerge(x2, x1Copy, crossPoint);
};

SimpleTSP.prototype.crossoverMerge = function (x1, x2, crossPoint) {
    var i, j, t, isLocationUsed;

    /*  Merges x2 onto x1 starting at crossPoint
        x1[0..crossPoint - 1] is unchanged.
        The remaining values for x1 are taken from x2 in the order that
        they appear. x2 is left unchanged. For example:

        x1 = [0, 1, 2, 3, 4, 5, 6]
        x2 = [0, 2, 4, 6, 1, 3, 5]
        crossPoint = 3

        result:
        x1 = [0, 1, 2, 4, 6, 3, 5]

        In this case, [0, 1, 2] is taken from the original x1. The remaining values are 3, 4, 5, 6.
        Looking at the x2 array, the order of these elements is [4, 6, 3, 5], which becomes the second part.
     */


    isLocationUsed = new Array(x1.length);
    for (i = 0; i < crossPoint; i++) {
        isLocationUsed[x1[i]] = true;
    }

    j = crossPoint;
    for (i = 0; i < (x1.length); i++) {
        t = x2[i];
        if (!isLocationUsed[t]) {
            x1[j] = t;
            j++;
        }
    }
};

SimpleTSP.prototype.twoOpt = function (x) {
    var iCheckStart, iCheckEnd, iSwap, t, changeMade, iCheckStartBest, iCheckEndBest, bestChange, thisChange;

    changeMade = true;
    while (changeMade) {
        changeMade = false;
        for (iCheckStart = 0; iCheckStart < x.length - 3; iCheckStart++) {
            bestChange = 0;
            for (iCheckEnd = iCheckStart + 3; iCheckEnd < x.length; iCheckEnd++) {
                thisChange = (this.nodeDistance[x[iCheckStart]][x[iCheckStart + 1]] + this.nodeDistance[x[iCheckEnd - 1]][x[iCheckEnd]]) -
                        (this.nodeDistance[x[iCheckStart]][x[iCheckEnd - 1]] + this.nodeDistance[x[iCheckStart + 1]][x[iCheckEnd]]);
                if (thisChange > bestChange) {
                    iCheckStartBest = iCheckStart;
                    iCheckEndBest = iCheckEnd;
                    bestChange = thisChange;
                }
            }
            if (bestChange > 0) {
                // We can improve the tour by reversing the nodes from iCheckStart + 1 to iCheckEnd - 1
                changeMade = true;
                for (iSwap = 0; iSwap < (iCheckEndBest - iCheckStartBest - 2)/2; iSwap++) {
                    t = x[iCheckStartBest + iSwap + 1];
                    x[iCheckStartBest + iSwap + 1] = x[iCheckEndBest - iSwap - 1];
                    x[iCheckEndBest - iSwap - 1] = t;
                }
            }
        }
    }
};
