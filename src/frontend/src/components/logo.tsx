import logoImg from '../assets/logo-img.png';

export default function Logo() {
  return (
    <div className='w-10 h-10'>
        <img src={logoImg} alt="logo image" />
    </div>
    
  );
}