import React, { useEffect, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ClockIcon } from 'lucide-react';
export function TimeSelect({
  value,
  onChange,
  className = ''
}) {
  // Parse the input time string (HH:MM) into hours and minutes
  const parseTime = timeString => {
    if (!timeString) return {
      hours: 12,
      minutes: 0,
      period: 'PM'
    };
    const [hours, minutes] = timeString.split(':').map(Number);
    // Convert 24-hour format to 12-hour format with AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return {
      hours: hours12,
      minutes,
      period
    };
  };
  // Format hours, minutes, and period back to HH:MM format (24-hour)
  const formatTime = (hours, minutes, period) => {
    // Convert 12-hour format to 24-hour format
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) {
      hours24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hours24 = 0;
    }
    return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  const {
    hours,
    minutes,
    period
  } = parseTime(value);
  const [selectedHours, setSelectedHours] = useState(hours);
  const [selectedMinutes, setSelectedMinutes] = useState(minutes);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  // Update the parent component when time changes
  useEffect(() => {
    const formattedTime = formatTime(selectedHours, selectedMinutes, selectedPeriod);
    onChange(formattedTime);
  }, [selectedHours, selectedMinutes, selectedPeriod]);
  // Update internal state when value changes from parent
  useEffect(() => {
    const {
      hours,
      minutes,
      period
    } = parseTime(value);
    setSelectedHours(hours);
    setSelectedMinutes(minutes);
    setSelectedPeriod(period);
  }, [value]);
  const incrementHours = () => {
    setSelectedHours(prev => prev === 12 ? 1 : prev + 1);
  };
  const decrementHours = () => {
    setSelectedHours(prev => prev === 1 ? 12 : prev - 1);
  };
  const incrementMinutes = () => {
    const newMinutes = (selectedMinutes + 5) % 60;
    setSelectedMinutes(newMinutes);
  };
  const decrementMinutes = () => {
    const newMinutes = (selectedMinutes - 5 + 60) % 60;
    setSelectedMinutes(newMinutes);
  };
  const togglePeriod = () => {
    setSelectedPeriod(prev => prev === 'AM' ? 'PM' : 'AM');
  };
  return <div className={`flex items-center border border-gray-300 rounded-md shadow-sm ${className}`}>
      <div className="flex items-center justify-center bg-gray-50 p-3 border-r border-gray-300">
        <ClockIcon size={20} className="text-gray-500" />
      </div>
      {/* Hours */}
      <div className="flex flex-col items-center">
        <button type="button" onClick={incrementHours} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Increment hours">
          <ChevronUpIcon size={18} />
        </button>
        <div className="w-12 text-center font-medium">
          {selectedHours.toString().padStart(2, '0')}
        </div>
        <button type="button" onClick={decrementHours} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Decrement hours">
          <ChevronDownIcon size={18} />
        </button>
      </div>
      <div className="text-xl font-medium text-gray-500 mx-1">:</div>
      {/* Minutes */}
      <div className="flex flex-col items-center">
        <button type="button" onClick={incrementMinutes} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Increment minutes">
          <ChevronUpIcon size={18} />
        </button>
        <div className="w-12 text-center font-medium">
          {selectedMinutes.toString().padStart(2, '0')}
        </div>
        <button type="button" onClick={decrementMinutes} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Decrement minutes">
          <ChevronDownIcon size={18} />
        </button>
      </div>
      {/* AM/PM */}
      <button type="button" onClick={togglePeriod} className="ml-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-r-md">
        {selectedPeriod}
      </button>
    </div>;
}