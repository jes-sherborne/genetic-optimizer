function GeneticOptimizer(options) {
	var defaults, iProperty;
	
	// Public properties

    this.population = [];
    this.populationMin = 0;
    this.populationMean = 0;
    this.populationMax = 0;
    this.incumbent = null;
    this.incumbentUpdated = null;
    this.options = {};

	// Defaults
    
    defaults = {
        populationSize: 100,
        iterationLimit: 1000,
        timeLimit: 5000,
        mutationProbability: 0.02,
        crossoverProbability: 0.6,
        improvementIterationLimit: 500,
        combinatorialFunction: null,
        objective: "maximize", // can also be "minimize"
        statusCallback: null,
        statusCallbackInterval: 1
    };
	
	// Process options

    for (iProperty in defaults) {
        if (defaults.hasOwnProperty(iProperty)) {
            this.options[iProperty] = defaults[iProperty];
        }
    }

    for (iProperty in options) {
        if (options.hasOwnProperty(iProperty)) {
            this.options[iProperty] = options[iProperty];
        }
    }

}

GeneticOptimizer.prototype.initializePopulation = function () {
    var i, length, uBound;

    this.population = [];
	length = this.options.combinatorialFunction.variableCount;
	uBound = this.options.combinatorialFunction.variableUBound

    for (i = 0; i < this.options.populationSize; i++) {
        this.population[i] = new GeneticOptimizer.GeneticIndividual(this.options.combinatorialFunction.getRandomIndividual(length, uBound));
    }
};

GeneticOptimizer.prototype.optimize = function () {
    var startTime, iteration, lastImprovedIteration, result;

    result = {};
    startTime = (new Date()).getTime();

    this.incumbentUpdated = false;
    this.initializePopulation();
    this.evaluatePopulation();
    lastImprovedIteration = 0;

    for (iteration = 1; iteration <= this.options.iterationLimit; iteration++) {
        this.incumbentUpdated = false;
        this.breedNewGeneration();
        this.evaluatePopulation();

        if (this.incumbentUpdated) {
            lastImprovedIteration = iteration;
        }

        if (this.options.statusCallback) {
            if (this.incumbentUpdated || ((this.options.statusCallbackInterval > 0) && (iteration % this.options.statusCallbackInterval == 0))){
                this.options.statusCallback({
                    iteration: iteration,
                    newIncumbent: true,
                    populationMin: this.populationMin,
                    populationMean: this.populationMean,
                    populationMax: this.populationMax
                });
            }
        }

        if (iteration - lastImprovedIteration >= this.options.improvementIterationLimit) {
            result.stoppingCriteria = "improvementIterationLimit";
            break;
        }

        if (((new Date()).getTime() - startTime) >= this.options.timeLimit) {
            result.stoppingCriteria = "timeLimit";
            break;
        }
    }

    if (!result.stoppingCriteria) {
        result.stoppingCriteria = "iterationLimit"
    }

	this.postProcessIncumbent();

	result.value = this.incumbent.value;
    result.x = this.incumbent.x.slice();
    result.lastImprovedIteration = lastImprovedIteration;

    return result;
};

GeneticOptimizer.prototype.scalePopulation = function (minValue, maxValue, meanValue, totalValue) {
    var i, valueRange;

    valueRange = maxValue - minValue;

    if (valueRange == 0) {
        for (i = 0; i < this.options.populationSize; i++) {
            this.population[i].scaledValue = 1.0;
        }
    } else if (this.options.objective === "minimize") {
        for (i = 0; i < this.options.populationSize; i++) {
            this.population[i].scaledValue = 10 * (maxValue - this.population[i].value)/valueRange + 0.5;
        }
    } else {
        for (i = 0; i < this.options.populationSize; i++) {
            this.population[i].scaledValue = 10 * (this.population[i].value - minValue)/valueRange + 0.5;
        }
    }

};

GeneticOptimizer.prototype.updateIncumbent = function (newIncumbent) {
    this.incumbent = newIncumbent.getClone();
    this.incumbentUpdated = true;
};

GeneticOptimizer.prototype.evaluatePopulation = function () {
    var i, cumulativeValue, minValue, maxValue, totalValue, meanValue, minIndividual, maxIndividual, populationSize;

    populationSize = this.options.populationSize;

	this.population[0].value = this.options.combinatorialFunction.getValue(this.population[0].x);

    totalValue = this.population[0].value;
    minValue = this.population[0].value;
    maxValue = this.population[0].value;
    minIndividual = 0;
    maxIndividual = 0;

    for (i = 1; i < populationSize; i++) {
        this.population[i].value = this.options.combinatorialFunction.getValue(this.population[i].x);
        if (this.population[i].value < minValue) {
            minValue = this.population[i].value;
            minIndividual = i;
        }
        if (this.population[i].value > maxValue) {
            maxValue = this.population[i].value;
            maxIndividual = i;
        }
        totalValue += this.population[i].value;
    }

    if (this.options.objective === "minimize") {
        if (!this.incumbent) {
            this.updateIncumbent(this.population[minIndividual]);
        } else if (this.incumbent.value > minValue) {
            this.updateIncumbent(this.population[minIndividual]);
        }
    } else {
        if (!this.incumbent) {
            this.updateIncumbent(this.population[maxIndividual]);
        } else if (this.incumbent.value < maxValue) {
            this.updateIncumbent(this.population[maxIndividual]);
        }
    }
    
    meanValue = totalValue / populationSize;

    this.scalePopulation(minValue, maxValue, meanValue, totalValue);

    cumulativeValue = 0;
    for (i = 0; i < populationSize; i++) {
        cumulativeValue += this.population[i].scaledValue;
        this.population[i].cumulativeScaledValue = cumulativeValue;
    }

    this.populationMin = minValue;
    this.populationMean = meanValue;
    this.populationMax = maxValue;

};

GeneticOptimizer.prototype.breedNewGeneration = function () {
    var newPopulation, i, p1, p2, newP1, newP2, populationSize, nVariables;
    
    newPopulation = [];
	populationSize = this.options.populationSize;
	nVariables = this.options.combinatorialFunction.variableCount;

    for (i = 0; i < populationSize; i += 2) {
        p1 = this.getIndividualFromPopulation();
        p2 = this.getIndividualFromPopulation();

        newP1 = new GeneticOptimizer.GeneticIndividual(p1.x.slice());
        newP2 = new GeneticOptimizer.GeneticIndividual(p2.x.slice());

        if (Math.random() <= this.options.crossoverProbability) {
            this.options.combinatorialFunction.crossover(newP1.x, newP2.x, nVariables);
        }

        if (Math.random() <= this.options.mutationProbability) {
            this.options.combinatorialFunction.mutate(newP1.x, nVariables, this.options.combinatorialFunction.variableUBound);
        }

        if (Math.random() <= this.options.mutationProbability) {
            this.options.combinatorialFunction.mutate(newP2.x, nVariables, this.options.combinatorialFunction.variableUBound);
        }

        newPopulation[i] = newP1;
        newPopulation[i + 1] = newP2;

    }

    this.population = newPopulation;
};

GeneticOptimizer.prototype.postProcessIncumbent = function () {
	var postProcessIndividual;

	if (this.incumbent && this.options.combinatorialFunction.postProcess) {
		postProcessIndividual = new GeneticOptimizer.GeneticIndividual(this.incumbent.x.slice());
		this.options.combinatorialFunction.postProcess(postProcessIndividual.x);
		postProcessIndividual.value = this.options.combinatorialFunction.getValue(postProcessIndividual.x);
		if ((this.options.objective === "minimize") && (this.incumbent.value > postProcessIndividual.value)) {
			this.updateIncumbent(postProcessIndividual);
		} else if ((this.options.objective === "maximize") && (this.incumbent.value < postProcessIndividual.value)) {
			this.updateIncumbent(postProcessIndividual);
		}
	}
};

GeneticOptimizer.prototype.getIndividualWeighted = function () {
    var r;

    r = Math.random() * this.population[this.options.populationSize - 1].cumulativeScaledValue;
    return GeneticOptimizer.arraySeekLowerBound(this.population, r, GeneticOptimizer.getCumulativeScaledValue);

};

GeneticOptimizer.prototype.getIndividualTournament = function () {
    var p1, p2;

    p1 = this.getIndividualWeighted();
    p2 = this.getIndividualWeighted();

    if (p1.value > p2.value) {
        return this.options.objective === "maximize" ? p1:p2;
    } else {
        return this.options.objective === "maximize" ? p2:p1;
    }
};

GeneticOptimizer.prototype.getIndividualRandom = function () {
    var i;

    i = Math.floor(Math.random() * this.options.populationSize);
    return this.population[i];

};

GeneticOptimizer.prototype.getIndividualFromPopulation = GeneticOptimizer.prototype.getIndividualTournament;

GeneticOptimizer.GeneticIndividual = function (x) {
	this.x = x;
	this.value = 0;
	this.scaledValue = 0;
	this.cumulativeScaledValue = 0;
};

GeneticOptimizer.GeneticIndividual.prototype.getClone = function () {
	var result;

	result = new GeneticOptimizer.GeneticIndividual(this.x.slice());
	result.value = this.value;
	result.scaledValue = this.scaledValue;
	result.cumulativeScaledValue = this.cumulativeScaledValue;

	return result;
};

GeneticOptimizer.getCumulativeScaledValue = function (item) {
    return item.cumulativeScaledValue;
};

GeneticOptimizer.arraySeekLowerBound = function (array, key, keyFunction) {
    var kLo, kHi, k;

    // Performs a binary search for key in array
    // Returns the largest element that is <= key
    // Array must be sorted in ascending order

	if (!array.length) {
		return null;
	}

    kHi = array.length - 1;
    kLo = 0;

	// Check bounds

    if (key > keyFunction(array[kHi])) {
		return null;
	}
    if (key < keyFunction(array[kLo])) {
		return array[kLo];
	}

	// Binary search

    while ((kHi - kLo) > 1) {
        k = (kHi + kLo) >>> 1;
        if (keyFunction(array[k]) > key) {
            kHi = k;
        } else {
            kLo = k;
        }
    }

	// The key value is bracketed by array[kLo] and array[kHi]

    if (key === keyFunction(array[kHi])) {
		return array[kHi];
	}
    return array[kLo];
};


GeneticOptimizer.crossoverSingle = function (x1, x2, length) {
    var i, crossPoint, t;

    crossPoint = Math.floor(Math.random() * length);

    for (i = crossPoint; i < length; i++) {
        t = x1[i];
        x1[i] = x2[i];
        x2[i] = t;
    }
};

GeneticOptimizer.crossoverDouble = function (x1, x2, length) {
    var i, crossPoint1, crossPoint2, t;

    crossPoint1 = Math.floor(Math.random() * length);
    crossPoint2 = Math.floor(Math.random() * length);

    if (crossPoint2 < crossPoint1) {
        t = crossPoint1;
        crossPoint1 = crossPoint2;
        crossPoint2 = t;
    }

    for (i = crossPoint1; i <= crossPoint2; i++) {
        t = x1[i];
        x1[i] = x2[i];
        x2[i] = t;
    }
};

GeneticOptimizer.crossoverMerge = function (x1, x2, length) {
    var i, t;

    for (i = 0; i < length; i++) {
        if (Math.random() < 0.5) {
            t = x1[i];
            x1[i] = x2[i];
            x2[i] = t;
        }
    }
};

GeneticOptimizer.mutateBasic = function (x, length, uBound) {
	var i;

	i = Math.floor(Math.random() * length);
	x[i] = Math.floor(Math.random() * (uBound[i] + 1));
};


GeneticOptimizer.getRandomIndividualBasic = function (length, uBound) {
    var i, result;

    result = new Array(length);
    for (i = 0; i < length; i++) {
        result[i] = Math.floor(Math.random() * (uBound[i] + 1));
    }

    return result;
};
