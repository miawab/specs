import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {DemoBlockedScenario} from "./DemoBlockedScenario"
import {DemoFarTableScenario} from "./DemoFarTableScenario"
import {DemoScenario} from "./DemoScenario"
import {DropScenario} from "./DropScenario"
import {FarTableScenario} from "./FarTableScenario"
import {MenuScenario} from "./MenuScenario"
import {MoveOnDeskScenario} from "./MoveOnDeskScenario"
import {ReachScenario} from "./ReachScenario"
import {RecAddScenario} from "./RecAddScenario"
import {RecBlockedScenario} from "./RecBlockedScenario"
import {RecFarSetupScenario} from "./RecFarSetupScenario"
import {RecFitsScenario} from "./RecFitsScenario"
import {ShelfFitScenario} from "./ShelfFitScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {
      id: "1-move-on-desk",
      typename: MoveOnDeskScenario.getTypeName(),
    },
    {
      id: "2-drop",
      typename: DropScenario.getTypeName(),
    },
    {
      id: "3-far-table",
      typename: FarTableScenario.getTypeName(),
    },
    {
      id: "4-shelf-fit",
      typename: ShelfFitScenario.getTypeName(),
    },
    {
      id: "5-menu",
      typename: MenuScenario.getTypeName(),
    },
    {
      id: "5b-menu-reach-ik",
      typename: ReachScenario.getTypeName(),
    },
    {
      id: "demo-far-table",
      typename: DemoFarTableScenario.getTypeName(),
    },
    {
      id: "demo-shelf-story",
      typename: DemoScenario.getTypeName(),
    },
    {
      id: "demo-blocked",
      typename: DemoBlockedScenario.getTypeName(),
    },
    {id: "rec-c07-add", typename: RecAddScenario.getTypeName()},
    {id: "rec-c08-blocked", typename: RecBlockedScenario.getTypeName()},
    {id: "rec-c09-fits", typename: RecFitsScenario.getTypeName()},
    {id: "rec-c11-far-setup", typename: RecFarSetupScenario.getTypeName()},
  ]
}
