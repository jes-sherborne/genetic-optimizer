function SimpleTSP(options) {
    var i, j;

    this.variableCount = options.nodeList.length;
    this.node = options.nodeList.slice();
	this.nodeDistance = null; //The distance from node to node

    this.eachVariableList = []; // We precompute an array with a value for each variable to speed up getRandomIndividual
    for (i = 0; i < this.variableCount; i++) {
        this.eachVariableList.push(i);
    }

    // To speed up calculations, we precompute the distance between all pairs of locations
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
    var i, result, length;

    result = 0;
	length = this.variableCount;
    for (i = 1; i < length; i++) {
        result += this.nodeDistance[x[i]][x[i - 1]];
    }

    return result;
};

SimpleTSP.prototype.mutate = function (x, length, uBound) {
    var i, j, t;

    // swaps two locations at random

	i = Math.floor(Math.random() * length);
    j = Math.floor(Math.random() * length);
    t = x[i];
    x[i] = x[j];
    x[j] = t;
};

SimpleTSP.prototype.getRandomIndividual = function (length, uBound) {
    var sampler;

    sampler = new SampleWithoutReplacement(this.eachVariableList);
    return sampler.getAllItems();

};

SimpleTSP.prototype.crossover = function (x1, x2, length) {
    var crossPoint, x1Copy;

    crossPoint = Math.floor(Math.random() * length);
    x1Copy = x1.slice(); //We need to keep a clean copy, because we change it in place

    this.crossoverInternal(x1, x2, length, crossPoint);
    this.crossoverInternal(x2, x1Copy, length, crossPoint);
};

SimpleTSP.prototype.crossoverInternal = function (x1, x2, length, crossPoint) {
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


    isLocationUsed = new Array(length);
    for (i = 0; i < crossPoint; i++) {
        isLocationUsed[x1[i]] = true;
    }

    j = crossPoint;
    for (i = 0; i < (length); i++) {
        t = x2[i];
        if (!isLocationUsed[t]) {
            x1[j] = t;
            j++;
        }
    }
};

SimpleTSP.prototype.postProcess = function (x) {
    var iCheckStart, iCheckEnd, iSwap, t, changeMade, iCheckStartBest, iCheckEndBest, bestChange, thisChange;

    /* Improves a tour using the TwoOpt heuristic. While this is not strictly a part of the genetic algorithm,
    it highlights and important point, which is that it is often worthwhile to use a local search heuristic after
    the genetic optimizer finishes. Essentially, this uses the genetic algorithm to find the right neighborhood for
    a solution and then attempts to improve it.
    */

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