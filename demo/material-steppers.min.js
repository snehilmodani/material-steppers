var StepperCtrl = (function () {
    function StepperCtrl($mdComponentRegistry, $attrs, $log) {
        this.$mdComponentRegistry = $mdComponentRegistry;
        this.$attrs = $attrs;
        this.$log = $log;
        this.labelStep = 'Step';
        this.labelOf = 'of';
        /* End of bindings */
        this.steps = [];
        this.currentStep = 0;
    }
    StepperCtrl.prototype.$onInit = function () {
        if (this.$attrs.mdMobileStepText === '') {
            this.mobileStepText = true;
        }
        if (this.$attrs.mdLinear === '') {
            this.linear = true;
        }
        if (this.$attrs.mdAlternative === '') {
            this.alternative = true;
        }
    };
    StepperCtrl.prototype.$postLink = function () {
        if (!this.$attrs.id) {
            this.$log.warn('You must set an id attribute to your stepper');
        }
        this.registeredStepper = this.$mdComponentRegistry.register(this, this.$attrs.id);
    };
    StepperCtrl.prototype.$onDestroy = function () {
        this.registeredStepper && this.registeredStepper();
    };
    /**
     * Register component step to this stepper.
     *
     * @param {StepCtrl} step The step to add.
     * @returns number - The step number.
     */
    StepperCtrl.prototype.$addStep = function (step) {
        return this.steps.push(step) - 1;
    };
    /**
     * Complete the current step and move one to the next.
     * Using this method on editable steps (in linear stepper)
     * it will search by the next step without "completed" state to move.
     * When invoked it dispatch the event onstepcomplete to the step element.
     *
     * @returns boolean - True if move and false if not move (e.g. On the last step)
     */
    StepperCtrl.prototype.next = function () {
        if (this.currentStep < (this.steps.length - 1)) {
            this.clearError();
            this.currentStep++;
            this.clearFeedback();
            return true;
        }
        return false;
    };
    /**
     * Move to the previous step without change the state of current step.
     * Using this method in linear stepper it will check if previous step is editable to move.
     *
     * @returns boolean - True if move and false if not move (e.g. On the first step)
     */
    StepperCtrl.prototype.back = function () {
        if (this.currentStep > 0) {
            this.clearError();
            this.currentStep--;
            this.clearFeedback();
            return true;
        }
        return false;
    };
    /**
     * Move to the next step without change the state of current step.
     * This method works only in optional steps.
     *
     * @returns boolean - True if move and false if not move (e.g. On non-optional step)
     */
    StepperCtrl.prototype.skip = function () {
        var step = this.steps[this.currentStep];
        if (step.optional) {
            this.currentStep++;
            this.clearFeedback();
            return true;
        }
        return false;
    };
    /**
     * Defines the current step state to "error" and shows the message parameter on
     * title message element.When invoked it dispatch the event onsteperror to the step element.
     *
     * @param {string} message The error message
     */
    StepperCtrl.prototype.error = function (message) {
        var step = this.steps[this.currentStep];
        step.hasError = true;
        step.message = message;
        this.clearFeedback();
    };
    /**
     * Defines the current step state to "normal" and removes the message parameter on
     * title message element.
     */
    StepperCtrl.prototype.clearError = function () {
        var step = this.steps[this.currentStep];
        step.hasError = false;
    };
    /**
     * Move "active" to specified step id parameter.
     * The id used as reference is the integer number shown on the label of each step (e.g. 2).
     *
     * @param {number} stepNumber (description)
     * @returns boolean - True if move and false if not move (e.g. On id not found)
     */
    StepperCtrl.prototype.goto = function (stepNumber) {
        if (stepNumber < this.steps.length) {
            this.currentStep = stepNumber;
            this.clearFeedback();
            return true;
        }
        return false;
    };
    /**
     * Shows a feedback message and a loading indicador.
     *
     * @param {string} [message] The feedbackMessage
     */
    StepperCtrl.prototype.showFeedback = function (message) {
        this.hasFeedback = true;
        this.feedbackMessage = message;
    };
    /**
     * Removes the feedback.
     */
    StepperCtrl.prototype.clearFeedback = function () {
        this.hasFeedback = false;
    };
    StepperCtrl.prototype.isCompleted = function (stepNumber) {
        return this.linear && stepNumber < this.currentStep;
    };
    ;
    StepperCtrl.prototype.isActiveStep = function (step) {
        return this.steps.indexOf(step) === this.currentStep;
    };
    StepperCtrl.$inject = [
        '$mdComponentRegistry',
        '$attrs',
        '$log'
    ];
    return StepperCtrl;
}());
var StepperServiceFactory = ['$mdComponentRegistry',
    function ($mdComponentRegistry) {
        return function (handle) {
            var instance = $mdComponentRegistry.get(handle);
            if (!instance) {
                $mdComponentRegistry.notFoundError(handle);
            }
            return instance;
        };
    }];
var StepCtrl = (function () {
    /**
     *
     */
    function StepCtrl($element, $compile, $scope) {
        this.$element = $element;
        this.$compile = $compile;
        this.$scope = $scope;
    }
    StepCtrl.prototype.$postLink = function () {
        this.stepNumber = this.$stepper.$addStep(this);
    };
    StepCtrl.prototype.isActive = function () {
        var state = this.$stepper.isActiveStep(this);
        return state;
    };
    StepCtrl.$inject = [
        '$element',
        '$compile',
        '$scope'
    ];
    return StepCtrl;
}());
angular.module('mdSteppers', ['ngMaterial'])
    .factory('$mdStepper', StepperServiceFactory)
    .directive('mdStepper', function () {
    return {
        transclude: true,
        scope: {
            linear: '<?mdLinear',
            alternative: '<?mdAlternative',
            vertical: '<?mdVertical',
            mobileStepText: '<?mdMobileStepText',
            labelStep: '@?mdLabelStep',
            labelOf: '@?mdLabelOf'
        },
        bindToController: true,
        controller: StepperCtrl,
        controllerAs: 'stepper',
        templateUrl: 'mdSteppers/mdStepper.tpl.html'
    };
})
    .directive('mdStep', ['$compile', function ($compile) {
        return {
            require: '^^mdStepper',
            transclude: true,
            scope: {
                label: '@mdLabel',
                optional: '@?mdOptional'
            },
            bindToController: true,
            controller: StepCtrl,
            controllerAs: '$ctrl',
            link: function (scope, iElement, iAttrs, stepperCtrl) {
                function addOverlay() {
                    var hasOverlay = !!iElement.find('.md-step-body-overlay')[0];
                    if (!hasOverlay) {
                        var overlay = angular.element("\n                            <div class=\"md-step-body-overlay\"></div>\n                            <div class=\"md-step-body-loading\">\n                                <md-progress-circular md-mode=\"indeterminate\"></md-progress-circular>\n                            </div>\n                        ");
                        $compile(overlay)(scope);
                        iElement.find('.md-steppers-scope').append(overlay);
                    }
                }
                scope.$ctrl.$stepper = stepperCtrl;
                scope.$watch(function () {
                    return scope.$ctrl.isActive();
                }, function (isActive) {
                    if (isActive) {
                        iElement.addClass('md-active');
                        addOverlay();
                    }
                    else {
                        iElement.removeClass('md-active');
                    }
                });
            },
            templateUrl: 'mdSteppers/mdStep.tpl.html'
        };
    }])
    .config(['$mdIconProvider', function ($mdIconProvider) {
        $mdIconProvider.icon('steppers-check', 'mdSteppers/ic_check_24px.svg');
        $mdIconProvider.icon('steppers-warning', 'mdSteppers/ic_warning_24px.svg');
    }])
    .run(["$templateCache", function ($templateCache) {
        $templateCache.put("mdSteppers/ic_check_24px.svg", '<svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24" enable-background="new 0 0 24 24" width="48" height="48" style="fill: rgb(255, 255, 255);"> <path style="text-indent:0;text-align:start;line-height:normal;text-transform:none;block-progression:tb;-inkscape-font-specification:Bitstream Vera Sans" d="M 19.28125 5.28125 L 9 15.5625 L 4.71875 11.28125 L 3.28125 12.71875 L 8.28125 17.71875 L 9 18.40625 L 9.71875 17.71875 L 20.71875 6.71875 L 19.28125 5.28125 z" color="#000" overflow="visible" enable-background="accumulate" font-family="Bitstream Vera Sans"/> </svg>');
        $templateCache.put("mdSteppers/ic_warning_24px.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" style="fill: rgb(255, 255, 255);"><path style="text-indent:0;text-align:start;line-height:normal;text-transform:none;block-progression:tb;-inkscape-font-specification:Bitstream Vera Sans" d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 L 7.71875 6.28125 z" color="#000" overflow="visible" enable-background="accumulate" font-family="Bitstream Vera Sans"/></svg>');
    }]);

angular.module("mdSteppers").run(["$templateCache", function($templateCache) {$templateCache.put("mdSteppers/mdStep.tpl.html","<div class=\"md-stepper\" ng-class=\"{ \'md-active\': $ctrl.isActive() }\">\n    <md-steppers-header class=\"md-steppers-header md-steppers-vertical\">\n        <button class=\"md-stepper-indicator\" ng-class=\"{\n                    \'md-active\': $ctrl.stepNumber === $ctrl.$stepper.currentStep,\n                    \'md-completed\': $ctrl.$stepper.isCompleted($ctrl.stepNumber),\n                    \'md-error\': $ctrl.hasError,\n                    \'md-stepper-optional\': $ctrl.optional || $ctrl.hasError\n                }\" ng-click=\"$ctrl.$stepper.goto($ctrl.stepNumber)\" ng-disabled=\"$ctrl.$stepper.linear || $ctrl.stepNumber === $ctrl.$stepper.currentStep\">\n                <div class=\"md-stepper-indicator-wrapper\">\n                    <div class=\"md-stepper-number\" ng-hide=\"$ctrl.hasError\">\n                    <span ng-if=\"!$ctrl.$stepper.isCompleted($ctrl.stepNumber)\">{{ ::$ctrl.stepNumber+1 }}</span>\n                        <md-icon md-svg-icon=\"steppers-check\" class=\"md-stepper-icon\" ng-if=\"$ctrl.$stepper.isCompleted($ctrl.stepNumber)\"></md-icon>\n                    </div>\n                    <div class=\"md-stepper-number warning\" ng-show=\"$ctrl.hasError\">\n                        <md-icon md-svg-icon=\"steppers-warning\" class=\"md-stepper-icon warning\"></md-icon>\n                    </div>\n\n                    <div class=\"md-stepper-title\">\n                        <span>{{ $ctrl.label }}</span>\n                        <small ng-if=\"$ctrl.optional && !$ctrl.hasError\">{{ $ctrl.optional }}</small>\n                        <small class=\"md-stepper-error-message\" ng-show=\"$ctrl.hasError\">\n                            {{ $ctrl.message }}\n                        </small>\n                    </div>\n                </div>\n                </button>\n        <div class=\"md-stepper-feedback-message\" ng-show=\"stepper.hasFeedback\">\n            {{stepper.feedbackMessage}}\n        </div>\n    </md-steppers-header>\n    <md-steppers-scope layout=\"column\" class=\"md-steppers-scope\" ng-if=\"$ctrl.isActive()\" ng-transclude></md-steppers-scope>\n</div>\n");
$templateCache.put("mdSteppers/mdStepper.tpl.html","<div flex class=\"md-steppers\" ng-class=\"{ \n    \'md-steppers-linear\': stepper.linear, \n    \'md-steppers-alternative\': stepper.alternative,\n    \'md-steppers-vertical\': stepper.vertical,\n    \'md-steppers-mobile-step-text\': stepper.mobileStepText,\n    \'md-steppers-has-feedback\': stepper.hasFeedback\n    }\">\n    <div class=\"md-steppers-header-region\">\n        <md-steppers-header class=\"md-steppers-header md-steppers-horizontal md-whiteframe-1dp\">\n            <button class=\"md-stepper-indicator\" ng-repeat=\"(stepNumber, $step) in stepper.steps track by $index\" ng-class=\"{\n                \'md-active\': stepNumber === stepper.currentStep,\n                \'md-completed\': stepper.isCompleted(stepNumber),\n                \'md-error\': $step.hasError,\n                \'md-stepper-optional\': $step.optional || $step.hasError\n            }\" ng-click=\"stepper.goto(stepNumber)\" ng-disabled=\"stepper.linear || stepNumber === stepper.currentStep\">\n            <div class=\"md-stepper-indicator-wrapper\">\n                <div class=\"md-stepper-number\" ng-hide=\"$step.hasError\">\n                    <span ng-if=\"!stepper.isCompleted(stepNumber)\">{{ ::stepNumber+1 }}</span>\n                    <md-icon md-svg-icon=\"steppers-check\" class=\"md-stepper-icon\" ng-if=\"stepper.isCompleted(stepNumber)\"></md-icon>\n                </div>\n\n                <div class=\"md-stepper-error-indicator\" ng-show=\"$step.hasError\">\n                <div class=\"md-stepper-number\" ng-hide=\"$step.hasError\">\n                    <md-icon md-svg-icon=\"steppers-warning\" class=\"md-stepper-icon warning\"></md-icon>\n                </div>\n                </div>\n                <div class=\"md-stepper-title\">\n                    <span>{{ $step.label }}</span>\n                    <small ng-if=\"$step.optional && !$step.hasError\">{{ $step.optional }}</small>\n                    <small class=\"md-stepper-error-message\" ng-show=\"$step.hasError\">\n                        {{ $step.message }}\n                    </small>\n                </div>\n            </div>\n            </button>\n           \n        </md-steppers-header>\n        <md-steppers-mobile-header class=\"md-steppers-mobile-header\">\n            <md-toolbar flex=\"none\" class=\"md-whiteframe-1dp\" style=\"background: #f6f6f6 !important; color: #202020 !important;\">\n                <div class=\"md-toolbar-tools\">\n                    <h3>\n                        <span>{{stepper.labelStep}} {{stepper.currentStep+1}} {{stepper.labelOf}} {{stepper.steps.length}}</span>\n                    </h3>\n                </div>\n            </md-toolbar>\n        </md-steppers-mobile-header>\n        <div class=\"md-stepper-feedback-message\" ng-show=\"stepper.hasFeedback\">\n            {{stepper.feedbackMessage}}\n        </div>\n    </div>\n    <md-steppers-content class=\"md-steppers-content\" ng-transclude></md-steppers-content>\n    <div class=\"md-steppers-overlay\"></div>\n</div>\n");}]);