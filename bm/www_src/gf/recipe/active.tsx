import * as React from "react";
import * as Modal from "react-modal";

import * as Proto from "../types";
import { HeatProgress } from "../heat-progress";
import { TimerProgress } from "../timer-progress";
import { Client }  from "../client";

import { InteractionModal }  from "./active/interaction-modal";
import { BoilAdditionModal }  from "./active/boil-addition-modal";

interface ActiveProps {
    client: Client;
    status1: Proto.Status1Data;
    status2: Proto.Status2Data;
    timer: Proto.TimerData;
    boil_alert_state: Proto.BoilAlertStateData;
    recipe: Proto.Recipe;
    temp: Proto.TempData;
}

export class Active extends React.Component<ActiveProps, {}> {
    constructor(props: ActiveProps) {
        super(props);
    }

    render = () => (
        <React.Fragment>
            <InteractionModal client={this.props.client} status1={this.props.status1} />
            <BoilAdditionModal client={this.props.client} status1={this.props.status1} boilAlertState={this.props.boil_alert_state} />
            <h2 className="bm-detail-panel-header">
                Recipe Active: {this.stepName()}
            </h2>
            <div className="bm-detail-panel-body">
                {this.renderHeatingMashingOrBoiling()}
            </div>
            <div className="bm-detail-panel-footer">
                {this.maybeRenderSkipToAddGrain()}
                {this.maybeRenderSkipHeating()}
                {this.maybeRenderSkipToNextStep()}
                <button onClick={this.handleCancelRecipe}>
                    Cancel Recipe
                </button>
            </div>
        </React.Fragment>
    );

    stepName() {
        let step_number = this.props.status1.step_number;
        let mash_steps = this.props.recipe.mash_steps.length;

        if (this.props.timer.active == false && step_number == 1) {
            return "Mash In";
        }
        if (step_number < mash_steps) {
            return "Mash " + step_number.toString();
        }
        else if (step_number == mash_steps) {
            if (mash_steps > 1) {
                return "Mash Out";
            }
            else {
                return "Mash " + step_number.toString();
            }
        }
        else {
            return "Boil";
        }
    }

    renderHeatingMashingOrBoiling() {
        if (this.props.status1.step_number > this.props.recipe.mash_steps.length) {
            if (this.props.timer.active) {
                return this.renderBoiling();
            }
            else {
                return this.renderHeatingToBoil();
            }
        }
        else if (this.props.timer.active) {
            return this.renderMashing();
        }
        else {
            return this.renderHeating();
        }
    }

    renderHeatingToBoil = () => (
        <>
            <div>Heating to Boil Temperature...</div>
            <HeatProgress temp={this.props.temp} />
        </>
    );

    renderBoiling = () => (
        <>
            <div>Boiling...</div>
            <TimerProgress timer={this.props.timer} />
        </>
    );

    renderHeating = () => (
        <>
            <div>Heating to Mash Temperature...</div>
            <HeatProgress temp={this.props.temp} />
        </>
    );

    renderMashing = () => (
        <>
            <div>Mashing...</div>
            <TimerProgress timer={this.props.timer} />
        </>
    );

    maybeRenderSkipToAddGrain() {
        let isHeatingWaterToStrikeTemp =
            this.props.status1.step_number == 1 &&
            !this.props.timer.active;

        if (!isHeatingWaterToStrikeTemp) {
            return <></>;
        }

        return <button onClick={this.handleSkipToAddGrain}>
            Skip to Add Grain
        </button>;
    }

    maybeRenderSkipHeating() {
        let canSkipHeating =
            this.props.status1.step_number > 1 &&
            this.props.status1.step_number <= this.props.recipe.mash_steps.length &&
            !this.props.timer.active;

        if (!canSkipHeating) {
            return <></>;
        }

        return <button onClick={this.handleSkipHeating}>
            Skip Heating
        </button>;
    }

    maybeRenderSkipToNextStep() {
        let canSkip =
            this.props.status1.step_number > 1 &&
            this.props.status1.step_number <= this.props.recipe.mash_steps.length &&
            this.props.timer.active;

        if (canSkip) {
            return <button onClick={this.handleSkipToNextStep}>
                Skip Step
            </button>;
        }
        else {
            return <></>;
        }
    }

    handleSkipToAddGrain = async () => {
        await this.props.client.skipToInteraction({ type: "AddGrain" });
    };

    handleSkipHeating = async () => {
        await this.props.client.skipToStep(this.props.status1.step_number, true);
    };

    handleSkipToNextStep = async () => {
        await this.props.client.skipToStep(this.props.status1.step_number + 1, false);
    };

    handleCancelRecipe = async () => {
        await this.props.client.cancelSession();
    };
}
