export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}