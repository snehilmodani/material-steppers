class StepperCtrl {

    public static $inject = [
        '$mdComponentRegistry',
        '$attrs',
        '$log'
    ];

    /* Bindings */

    public linear: boolean;
    public alternative: boolean;
    public vertical: boolean;
    public mobileStepText: boolean;
    public labelStep: string = 'Step';
    public labelOf: string = 'of';

    /* End of bindings */

    public steps = [];
    public currentStep = 0;

    private hasFeedback: boolean;
    private feedbackMessage: string;
    private registeredStepper;

    constructor(
        private $mdComponentRegistry,
        private $attrs,
        private $log
    ) { }


    $onInit() {
        if (this.$attrs.mdMobileStepText === '') {
            this.mobileStepText = true;
        }
        if (this.$attrs.mdLinear === '') {
            this.linear = true;
        }
        if (this.$attrs.mdAlternative === '') {
            this.alternative = true;
        }
    }

    $postLink() {
        if (!this.$attrs.id) {
            this.$log.warn('You must set an id attribute to your stepper');
        }
        this.registeredStepper = this.$mdComponentRegistry.register(this, this.$attrs.id);
    }

    $onDestroy() {
        this.registeredStepper && this.registeredStepper();
    }

    /**
     * Register component step to this stepper.
     * 
     * @param {StepCtrl} step The step to add.
     * @returns number - The step number.
     */
    $addStep(step: StepCtrl) {
        return this.steps.push(step) - 1;
    }

    /**
     * Complete the current step and move one to the next. 
     * Using this method on editable steps (in linear stepper) 
     * it will search by the next step without "completed" state to move. 
     * When invoked it dispatch the event onstepcomplete to the step element.
     * 
     * @returns boolean - True if move and false if not move (e.g. On the last step)
     */
    public next() {
        if (this.currentStep < this.steps.length) {
            this.clearError();
            this.currentStep++;
            this.clearFeedback();
            return true;
        }
        return false;
    }

    /**
     * Move to the previous step without change the state of current step. 
     * Using this method in linear stepper it will check if previous step is editable to move.
     * 
     * @returns boolean - True if move and false if not move (e.g. On the first step)
     */
    public back() {
        if (this.currentStep > 0) {
            this.clearError();
            this.currentStep--;
            this.clearFeedback();
            return true;
        }
        return false;
    }

    /**
     * Move to the next step without change the state of current step. 
     * This method works only in optional steps.
     * 
     * @returns boolean - True if move and false if not move (e.g. On non-optional step)
     */
    public skip() {
        let step = this.steps[this.currentStep];
        if (step.optional) {
            this.currentStep++;
            this.clearFeedback();
            return true;
        }
        return false;
    }


    /**
     * Defines the current step state to "error" and shows the message parameter on 
     * title message element.When invoked it dispatch the event onsteperror to the step element.
     * 
     * @param {string} message The error message
     */
    public error(message: string) {
        let step = this.steps[this.currentStep];
        step.hasError = true;
        step.message = message;
        this.clearFeedback();
    }

    /**
     * Defines the current step state to "normal" and removes the message parameter on 
     * title message element.
     */
    public clearError() {
        let step = this.steps[this.currentStep];
        step.hasError = false;
    }

    /**
     * Move "active" to specified step id parameter. 
     * The id used as reference is the integer number shown on the label of each step (e.g. 2).
     * 
     * @param {number} stepNumber (description)
     * @returns boolean - True if move and false if not move (e.g. On id not found)
     */
    public goto(stepNumber: number) {
        if (stepNumber < this.steps.length) {
            this.currentStep = stepNumber;
            this.clearFeedback();
            return true;
        }
        return false;
    }

    /**
     * Shows a feedback message and a loading indicador.
     * 
     * @param {string} [message] The feedbackMessage
     */
    public showFeedback(message?: string) {
        this.hasFeedback = true;
        this.feedbackMessage = message;
    }

    /**
     * Removes the feedback.
     */
    public clearFeedback() {
        this.hasFeedback = false;
    }


    isCompleted(stepNumber: number) {
        return this.linear && stepNumber < this.currentStep;
    };

    isActiveStep(step: StepCtrl) {
        return this.steps.indexOf(step) === this.currentStep;
    }
}

interface StepperService {
    (handle: string): StepperCtrl;
}

let StepperServiceFactory = ['$mdComponentRegistry',
    function ($mdComponentRegistry) {
        return <StepperService>function (handle: string) {
            let instance: StepperCtrl = $mdComponentRegistry.get(handle);

            if (!instance) {
                $mdComponentRegistry.notFoundError(handle);
            }

            return instance;
        };
    }];


class StepCtrl {

    public static $inject = [
        '$element',
        '$compile',
        '$scope'
    ];

    /* Bindings */

    public label: string;
    public optional: string;

    /* End of bindings */

    public stepNumber: number;

    public $stepper: StepperCtrl;

    /**
     *
     */
    constructor(
        private $element,
        private $compile: ng.ICompileService,
        private $scope: ng.IScope
    ) { }

    $postLink() {
        this.stepNumber = this.$stepper.$addStep(this);
    }

    isActive() {
        let state = this.$stepper.isActiveStep(this);
        return state;
    }
}

angular.module('mdSteppers', ['ngMaterial'])
    .factory('$mdStepper', StepperServiceFactory)

    .directive('mdStepper', () => {
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
            // link: function (scope, element, attrs) {
            //     scope.stepper.mobileStepText = !!attrs.$attr['mdMobileStepText'];
            // }
        };
    })
    .directive('mdStep', ['$compile', ($compile) => {
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
            link: (scope: any, iElement: ng.IRootElementService, iAttrs, stepperCtrl: StepperCtrl) => {
                function addOverlay() {
                    let hasOverlay = !!iElement.find('.md-step-body-overlay')[0];
                    if (!hasOverlay) {
                        let overlay = angular.element(`
                            <div class="md-step-body-overlay"></div>
                            <div class="md-step-body-loading">
                                <md-progress-circular md-mode="indeterminate"></md-progress-circular>
                            </div>
                        `);
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
                    } else {
                        iElement.removeClass('md-active');
                    }
                });
            },
            templateUrl: 'mdSteppers/mdStep.tpl.html'
        };
    }])

    .config(['$mdIconProvider', ($mdIconProvider) => {
        $mdIconProvider.icon('steppers-check', 'mdSteppers/ic_check_24px.svg');
        $mdIconProvider.icon('steppers-warning', 'mdSteppers/ic_warning_24px.svg');
    }])
    .run(["$templateCache", function ($templateCache) {
        $templateCache.put("mdSteppers/ic_check_24px.svg", '<svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24" enable-background="new 0 0 24 24" width="48" height="48" style="fill: rgb(255, 255, 255);"> <path style="text-indent:0;text-align:start;line-height:normal;text-transform:none;block-progression:tb;-inkscape-font-specification:Bitstream Vera Sans" d="M 19.28125 5.28125 L 9 15.5625 L 4.71875 11.28125 L 3.28125 12.71875 L 8.28125 17.71875 L 9 18.40625 L 9.71875 17.71875 L 20.71875 6.71875 L 19.28125 5.28125 z" color="#000" overflow="visible" enable-background="accumulate" font-family="Bitstream Vera Sans"/> </svg>');
        $templateCache.put("mdSteppers/ic_warning_24px.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" style="fill: rgb(255, 255, 255);"><path style="text-indent:0;text-align:start;line-height:normal;text-transform:none;block-progression:tb;-inkscape-font-specification:Bitstream Vera Sans" d="M 9.15625 6.3125 L 6.3125 9.15625 L 22.15625 25 L 6.21875 40.96875 L 9.03125 43.78125 L 25 27.84375 L 40.9375 43.78125 L 43.78125 40.9375 L 27.84375 25 L 43.6875 9.15625 L 40.84375 6.3125 L 25 22.15625 L 9.15625 6.3125 z" color="#000" overflow="visible" enable-background="accumulate" font-family="Bitstream Vera Sans"/></svg>');
    }]);

