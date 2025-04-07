import React from "react";
import { assets } from "../../assets/assets";

const CallToAction = () => {
  return (
    <div className="flex flex-col items-center gap-4 pt-10 pb-24 md:px-0 px-8">
      <h1 className="text-xl md:text-4xl font-semibold text-gray-800">
        Learn anything, anytime, anywhere
      </h1>

      <p className="sm:text-sm text-gray-500">
        Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim id
        veniam <br /> aliqua proident excepteur commodo do ea.
      </p>

      <div className="flex items-center font-medium gap-6 mt-4">
        <button className="px-10 py-3 rounded-md bg-blue-600 text-white">
          Get started
        </button>

        <button className="flex items-center gap-2">
          Learn more
          <img src={assets.arrow_icon} alt="arrow_icon" />
        </button>
      </div>
    </div>
  );
};

export default CallToAction;
