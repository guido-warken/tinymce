import { navigator } from "@ephox/dom-globals";

const skip = function () {
  return navigator.userAgent.indexOf('PhantomJS') > -1;
};

export default <any> {
  skip
};