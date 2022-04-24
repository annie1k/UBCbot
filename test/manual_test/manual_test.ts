import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/TestUtil";

const facade = new InsightFacade();
// clearDisk();
facade.addDataset("small", getContentFromArchives("small.zip"), InsightDatasetKind.Courses);
