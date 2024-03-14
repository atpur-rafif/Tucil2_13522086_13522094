import "./index.css";
import "./module/autoreload.ts";
import { Canvas } from "./module/canvas";
import { $ } from "./module/util";

const body = $("body");
const canvas = new Canvas();
body.appendChild(canvas.el);
